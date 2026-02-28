package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type DashboardRepo struct {
	snippets *SnippetRepo
	expenses *ExpenseRepo
	habits   *HabitRepo
	kanban   *KanbanRepo
}

func NewDashboardRepo(s *SnippetRepo, e *ExpenseRepo, h *HabitRepo, k *KanbanRepo) *DashboardRepo {
	return &DashboardRepo{snippets: s, expenses: e, habits: h, kanban: k}
}

func (r *DashboardRepo) Stats(ctx context.Context, userID uuid.UUID) (*models.DashboardStats, error) {
	sc, err := r.snippets.CountByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	ec, err := r.expenses.CountByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	hc, err := r.habits.CountByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	bc, err := r.kanban.CountBoards(ctx, userID)
	if err != nil {
		return nil, err
	}
	return &models.DashboardStats{
		Snippets: sc,
		Expenses: ec,
		Habits:   hc,
		Boards:   bc,
	}, nil
}

func (r *DashboardRepo) Recent(ctx context.Context, userID uuid.UUID) (*models.DashboardRecent, error) {
	snippets, err := r.snippets.RecentByUser(ctx, userID, 5)
	if err != nil {
		return nil, err
	}
	return &models.DashboardRecent{
		RecentSnippets: snippets,
	}, nil
}
