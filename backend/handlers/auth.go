package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"

	"github.com/thammasornlueadtaharn/devpulse-backend/helpers"
	"github.com/thammasornlueadtaharn/devpulse-backend/repository"
)

type AuthHandler struct {
	users       *repository.UserRepo
	sessions    *repository.SessionRepo
	profiles    *repository.ProfileRepo
	oauthConfig *oauth2.Config
	frontendURL string
}

func NewAuthHandler(
	users *repository.UserRepo,
	sessions *repository.SessionRepo,
	profiles *repository.ProfileRepo,
	clientID, clientSecret, callbackURL, frontendURL string,
) *AuthHandler {
	var oauthCfg *oauth2.Config
	if clientID != "" && clientSecret != "" {
		oauthCfg = &oauth2.Config{
			ClientID:     clientID,
			ClientSecret: clientSecret,
			Endpoint:     github.Endpoint,
			RedirectURL:  callbackURL,
			Scopes:       []string{"user:email"},
		}
	}
	return &AuthHandler{
		users:       users,
		sessions:    sessions,
		profiles:    profiles,
		oauthConfig: oauthCfg,
		frontendURL: frontendURL,
	}
}

type authRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req authRequest
	if err := helpers.DecodeJSON(r, &req); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || len(req.Password) < 6 {
		helpers.Error(w, http.StatusBadRequest, "email required and password must be at least 6 characters")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to hash password")
		return
	}

	user, err := h.users.Create(r.Context(), req.Email, string(hash))
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			helpers.Error(w, http.StatusConflict, "email already registered")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to create user")
		return
	}

	// Create profile
	h.profiles.Upsert(r.Context(), user.ID, user.Email)

	session, err := h.sessions.Create(r.Context(), user.ID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to create session")
		return
	}

	setSessionCookie(w, session.Token, session.ExpiresAt)
	helpers.JSON(w, http.StatusCreated, map[string]string{"message": "registered"})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req authRequest
	if err := helpers.DecodeJSON(r, &req); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	user, err := h.users.FindByEmail(r.Context(), req.Email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			helpers.Error(w, http.StatusUnauthorized, "invalid email or password")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to find user")
		return
	}

	if user.PasswordHash == nil {
		helpers.Error(w, http.StatusUnauthorized, "this account uses GitHub login")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(req.Password)); err != nil {
		helpers.Error(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	session, err := h.sessions.Create(r.Context(), user.ID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to create session")
		return
	}

	setSessionCookie(w, session.Token, session.ExpiresAt)
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "logged in"})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_token")
	if err == nil && cookie.Value != "" {
		h.sessions.Delete(r.Context(), cookie.Value)
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})

	helpers.JSON(w, http.StatusOK, map[string]string{"message": "logged out"})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())

	user, err := h.users.FindByID(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusNotFound, "user not found")
		return
	}

	profile, _ := h.profiles.FindByID(r.Context(), userID)

	helpers.JSON(w, http.StatusOK, map[string]any{
		"user":    user,
		"profile": profile,
	})
}

func (h *AuthHandler) GitHubRedirect(w http.ResponseWriter, r *http.Request) {
	if h.oauthConfig == nil {
		helpers.Error(w, http.StatusNotImplemented, "GitHub OAuth not configured")
		return
	}
	url := h.oauthConfig.AuthCodeURL("state")
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func (h *AuthHandler) GitHubCallback(w http.ResponseWriter, r *http.Request) {
	if h.oauthConfig == nil {
		helpers.Error(w, http.StatusNotImplemented, "GitHub OAuth not configured")
		return
	}

	code := r.URL.Query().Get("code")
	if code == "" {
		http.Redirect(w, r, h.frontendURL+"/auth/login?error=auth_failed", http.StatusTemporaryRedirect)
		return
	}

	token, err := h.oauthConfig.Exchange(r.Context(), code)
	if err != nil {
		log.Printf("GitHub OAuth exchange error: %v", err)
		http.Redirect(w, r, h.frontendURL+"/auth/login?error=auth_failed", http.StatusTemporaryRedirect)
		return
	}

	// Get GitHub user info
	client := h.oauthConfig.Client(r.Context(), token)
	resp, err := client.Get("https://api.github.com/user")
	if err != nil {
		log.Printf("GitHub API error: %v", err)
		http.Redirect(w, r, h.frontendURL+"/auth/login?error=auth_failed", http.StatusTemporaryRedirect)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var ghUser struct {
		ID        int64  `json:"id"`
		Email     string `json:"email"`
		Login     string `json:"login"`
		Name      string `json:"name"`
		AvatarURL string `json:"avatar_url"`
	}
	json.Unmarshal(body, &ghUser)

	// If no public email, fetch from emails API
	if ghUser.Email == "" {
		emailResp, err := client.Get("https://api.github.com/user/emails")
		if err == nil {
			defer emailResp.Body.Close()
			emailBody, _ := io.ReadAll(emailResp.Body)
			var emails []struct {
				Email   string `json:"email"`
				Primary bool   `json:"primary"`
			}
			json.Unmarshal(emailBody, &emails)
			for _, e := range emails {
				if e.Primary {
					ghUser.Email = e.Email
					break
				}
			}
		}
	}

	if ghUser.Email == "" {
		ghUser.Email = ghUser.Login + "@github.local"
	}

	user, err := h.users.FindOrCreateByGitHub(r.Context(), ghUser.ID, ghUser.Email)
	if err != nil {
		log.Printf("FindOrCreateByGitHub error: %v", err)
		http.Redirect(w, r, h.frontendURL+"/auth/login?error=auth_failed", http.StatusTemporaryRedirect)
		return
	}

	// Upsert profile with GitHub info
	profile, _ := h.profiles.Upsert(r.Context(), user.ID, ghUser.Email)
	if profile != nil {
		displayName := ghUser.Name
		if displayName == "" {
			displayName = ghUser.Login
		}
		avatarURL := ghUser.AvatarURL
		h.profiles.Update(r.Context(), user.ID, repository.ProfileUpdateFromGitHub(displayName, avatarURL))
	}

	session, err := h.sessions.Create(r.Context(), user.ID)
	if err != nil {
		log.Printf("Session create error: %v", err)
		http.Redirect(w, r, h.frontendURL+"/auth/login?error=auth_failed", http.StatusTemporaryRedirect)
		return
	}

	setSessionCookie(w, session.Token, session.ExpiresAt)
	http.Redirect(w, r, h.frontendURL+"/dashboard", http.StatusTemporaryRedirect)
}

func setSessionCookie(w http.ResponseWriter, token string, expiresAt interface{ Unix() int64 }) {
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    token,
		Path:     "/",
		MaxAge:   30 * 24 * 60 * 60, // 30 days
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   false, // set true in production with HTTPS
	})
}
