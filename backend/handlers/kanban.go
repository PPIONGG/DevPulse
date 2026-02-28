package handlers

import (
	"errors"
	"net/http"

	"github.com/google/uuid"
	"github.com/thammasornlueadtaharn/devpulse-backend/helpers"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
	"github.com/thammasornlueadtaharn/devpulse-backend/repository"
)

type KanbanHandler struct {
	repo *repository.KanbanRepo
}

func NewKanbanHandler(repo *repository.KanbanRepo) *KanbanHandler {
	return &KanbanHandler{repo: repo}
}

// --- Boards ---

func (h *KanbanHandler) ListBoards(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	boards, err := h.repo.ListBoards(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch boards")
		return
	}
	helpers.JSON(w, http.StatusOK, boards)
}

func (h *KanbanHandler) GetBoard(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid board ID")
		return
	}
	board, err := h.repo.GetBoardFull(r.Context(), id, userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch board")
		return
	}
	helpers.JSON(w, http.StatusOK, board)
}

func (h *KanbanHandler) CreateBoard(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var input models.KanbanBoardInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" {
		helpers.Error(w, http.StatusBadRequest, "title is required")
		return
	}
	board, err := h.repo.CreateBoard(r.Context(), userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to create board")
		return
	}
	helpers.JSON(w, http.StatusCreated, board)
}

func (h *KanbanHandler) UpdateBoard(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid board ID")
		return
	}
	var input models.KanbanBoardInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" {
		helpers.Error(w, http.StatusBadRequest, "title is required")
		return
	}
	board, err := h.repo.UpdateBoard(r.Context(), id, userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update board")
		return
	}
	helpers.JSON(w, http.StatusOK, board)
}

func (h *KanbanHandler) DeleteBoard(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid board ID")
		return
	}
	if err := h.repo.DeleteBoard(r.Context(), id, userID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "board not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete board")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

// --- Columns ---

func (h *KanbanHandler) CreateColumn(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	boardID, err := uuid.Parse(r.PathValue("boardId"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid board ID")
		return
	}
	var input models.KanbanColumnInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" {
		helpers.Error(w, http.StatusBadRequest, "title is required")
		return
	}
	if input.Color == "" {
		input.Color = "#6b7280"
	}
	col, err := h.repo.CreateColumn(r.Context(), boardID, userID, input)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "board not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to create column")
		return
	}
	helpers.JSON(w, http.StatusCreated, col)
}

func (h *KanbanHandler) UpdateColumn(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	colID, err := uuid.Parse(r.PathValue("colId"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid column ID")
		return
	}
	var input models.KanbanColumnInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" {
		helpers.Error(w, http.StatusBadRequest, "title is required")
		return
	}
	col, err := h.repo.UpdateColumn(r.Context(), colID, userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update column")
		return
	}
	helpers.JSON(w, http.StatusOK, col)
}

func (h *KanbanHandler) DeleteColumn(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	colID, err := uuid.Parse(r.PathValue("colId"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid column ID")
		return
	}
	if err := h.repo.DeleteColumn(r.Context(), colID, userID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "column not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete column")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

// --- Cards ---

func (h *KanbanHandler) CreateCard(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	colID, err := uuid.Parse(r.PathValue("colId"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid column ID")
		return
	}
	var input models.KanbanCardInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" {
		helpers.Error(w, http.StatusBadRequest, "title is required")
		return
	}
	validPriorities := map[string]bool{"low": true, "medium": true, "high": true, "urgent": true}
	if !validPriorities[input.Priority] {
		input.Priority = "medium"
	}
	card, err := h.repo.CreateCard(r.Context(), colID, userID, input)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "column not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to create card")
		return
	}
	helpers.JSON(w, http.StatusCreated, card)
}

func (h *KanbanHandler) UpdateCard(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	cardID, err := uuid.Parse(r.PathValue("cardId"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid card ID")
		return
	}
	var input models.KanbanCardInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" {
		helpers.Error(w, http.StatusBadRequest, "title is required")
		return
	}
	card, err := h.repo.UpdateCard(r.Context(), cardID, userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update card")
		return
	}
	helpers.JSON(w, http.StatusOK, card)
}

func (h *KanbanHandler) DeleteCard(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	cardID, err := uuid.Parse(r.PathValue("cardId"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid card ID")
		return
	}
	if err := h.repo.DeleteCard(r.Context(), cardID, userID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "card not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete card")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

func (h *KanbanHandler) ReorderCards(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var updates []repository.CardPosition
	if err := helpers.DecodeJSON(r, &updates); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if len(updates) == 0 {
		helpers.JSON(w, http.StatusOK, map[string]string{"message": "ok"})
		return
	}
	if err := h.repo.ReorderCards(r.Context(), userID, updates); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "card or column not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to reorder cards")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "reordered"})
}
