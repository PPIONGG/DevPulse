package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type DashboardRepo struct {
	snippets *SnippetRepo
}

func NewDashboardRepo(s *SnippetRepo) *DashboardRepo {
	return &DashboardRepo{snippets: s}
}

func (r *DashboardRepo) Stats(ctx context.Context, userID uuid.UUID) (*models.DashboardStats, error) {
	sc, err := r.snippets.CountByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	return &models.DashboardStats{
		Snippets: sc,
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
