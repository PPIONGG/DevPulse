package handlers

import (
	"errors"
	"net/http"

	"github.com/google/uuid"
	"github.com/thammasornlueadtaharn/devpulse-backend/helpers"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
	"github.com/thammasornlueadtaharn/devpulse-backend/repository"
)

type MarketplaceHandler struct {
	repo *repository.MarketplaceRepo
}

func NewMarketplaceHandler(repo *repository.MarketplaceRepo) *MarketplaceHandler {
	return &MarketplaceHandler{repo: repo}
}

func (h *MarketplaceHandler) BrowseListings(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	search := r.URL.Query().Get("search")
	language := r.URL.Query().Get("language")
	sort := r.URL.Query().Get("sort")

	listings, err := h.repo.ListPublished(r.Context(), userID, search, language, sort)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch listings")
		return
	}
	helpers.JSON(w, http.StatusOK, listings)
}

func (h *MarketplaceHandler) GetListing(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid listing ID")
		return
	}
	listing, err := h.repo.GetListing(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "listing not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch listing")
		return
	}
	helpers.JSON(w, http.StatusOK, listing)
}

func (h *MarketplaceHandler) MyListings(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	listings, err := h.repo.ListByUser(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch listings")
		return
	}
	helpers.JSON(w, http.StatusOK, listings)
}

func (h *MarketplaceHandler) CreateListing(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var input models.ListingInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" {
		helpers.Error(w, http.StatusBadRequest, "title is required")
		return
	}
	if input.Tags == nil {
		input.Tags = []string{}
	}
	if input.Currency == "" {
		input.Currency = "usd"
	}
	listing, err := h.repo.CreateListing(r.Context(), userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to create listing")
		return
	}
	helpers.JSON(w, http.StatusCreated, listing)
}

func (h *MarketplaceHandler) UpdateListing(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid listing ID")
		return
	}
	var input models.ListingInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" {
		helpers.Error(w, http.StatusBadRequest, "title is required")
		return
	}
	if input.Tags == nil {
		input.Tags = []string{}
	}
	if input.Currency == "" {
		input.Currency = "usd"
	}
	listing, err := h.repo.UpdateListing(r.Context(), id, userID, input)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "listing not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to update listing")
		return
	}
	helpers.JSON(w, http.StatusOK, listing)
}

func (h *MarketplaceHandler) DeleteListing(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid listing ID")
		return
	}
	if err := h.repo.DeleteListing(r.Context(), id, userID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "listing not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete listing")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

func (h *MarketplaceHandler) CreatePurchase(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var body struct {
		ListingID string `json:"listing_id"`
	}
	if err := helpers.DecodeJSON(r, &body); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	listingID, err := uuid.Parse(body.ListingID)
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid listing ID")
		return
	}
	purchase, err := h.repo.CreatePurchase(r.Context(), userID, listingID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "listing not found")
			return
		}
		if errors.Is(err, repository.ErrAlreadyPurchased) {
			helpers.Error(w, http.StatusConflict, "already purchased")
			return
		}
		if errors.Is(err, repository.ErrCannotPurchaseOwn) {
			helpers.Error(w, http.StatusBadRequest, "cannot purchase your own listing")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to create purchase")
		return
	}
	helpers.JSON(w, http.StatusCreated, purchase)
}

func (h *MarketplaceHandler) MyPurchases(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	purchases, err := h.repo.ListPurchases(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch purchases")
		return
	}
	helpers.JSON(w, http.StatusOK, purchases)
}

func (h *MarketplaceHandler) GetReviews(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid listing ID")
		return
	}
	reviews, err := h.repo.ListReviews(r.Context(), id)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch reviews")
		return
	}
	helpers.JSON(w, http.StatusOK, reviews)
}

func (h *MarketplaceHandler) CreateReview(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	listingID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid listing ID")
		return
	}
	var input models.ReviewInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Rating < 1 || input.Rating > 5 {
		helpers.Error(w, http.StatusBadRequest, "rating must be between 1 and 5")
		return
	}
	review, err := h.repo.CreateReview(r.Context(), userID, listingID, input)
	if err != nil {
		if errors.Is(err, repository.ErrNotPurchased) {
			helpers.Error(w, http.StatusForbidden, "must purchase listing before reviewing")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to create review")
		return
	}
	helpers.JSON(w, http.StatusCreated, review)
}

func (h *MarketplaceHandler) UpdateReview(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	reviewID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid review ID")
		return
	}
	var input models.ReviewInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Rating < 1 || input.Rating > 5 {
		helpers.Error(w, http.StatusBadRequest, "rating must be between 1 and 5")
		return
	}
	review, err := h.repo.UpdateReview(r.Context(), reviewID, userID, input)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "review not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to update review")
		return
	}
	helpers.JSON(w, http.StatusOK, review)
}

func (h *MarketplaceHandler) DeleteReview(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	reviewID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid review ID")
		return
	}
	if err := h.repo.DeleteReview(r.Context(), reviewID, userID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "review not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete review")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

func (h *MarketplaceHandler) SellerDashboard(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	stats, err := h.repo.SellerStats(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch seller stats")
		return
	}
	helpers.JSON(w, http.StatusOK, stats)
}
