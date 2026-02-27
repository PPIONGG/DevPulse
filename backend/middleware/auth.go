package middleware

import (
	"net/http"

	"github.com/thammasornlueadtaharn/devpulse-backend/helpers"
	"github.com/thammasornlueadtaharn/devpulse-backend/repository"
)

func Auth(sessionRepo *repository.SessionRepo) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie("session_token")
			if err != nil || cookie.Value == "" {
				helpers.Error(w, http.StatusUnauthorized, "unauthorized")
				return
			}

			session, err := sessionRepo.FindValid(r.Context(), cookie.Value)
			if err != nil {
				helpers.Error(w, http.StatusUnauthorized, "unauthorized")
				return
			}

			ctx := helpers.WithUserID(r.Context(), session.UserID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
