package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type DashboardRepo struct {
	snippets *SnippetRepo
	workLogs *WorkLogRepo
	articles *ArticleRepo
	bookmarks *BookmarkRepo
}

func NewDashboardRepo(s *SnippetRepo, w *WorkLogRepo, a *ArticleRepo, b *BookmarkRepo) *DashboardRepo {
	return &DashboardRepo{snippets: s, workLogs: w, articles: a, bookmarks: b}
}

func (r *DashboardRepo) Stats(ctx context.Context, userID uuid.UUID) (*models.DashboardStats, error) {
	sc, err := r.snippets.CountByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	wc, err := r.workLogs.CountByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	ac, err := r.articles.CountByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	bc, err := r.bookmarks.CountByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	return &models.DashboardStats{
		Snippets: sc, WorkLogs: wc, Articles: ac, Bookmarks: bc,
	}, nil
}

func (r *DashboardRepo) Recent(ctx context.Context, userID uuid.UUID, weekStart string) (*models.DashboardRecent, error) {
	snippets, err := r.snippets.RecentByUser(ctx, userID, 5)
	if err != nil {
		return nil, err
	}
	workLogs, err := r.workLogs.RecentByUser(ctx, userID, 5)
	if err != nil {
		return nil, err
	}
	hours, err := r.workLogs.WeeklyHours(ctx, userID, weekStart)
	if err != nil {
		return nil, err
	}
	return &models.DashboardRecent{
		RecentSnippets: snippets,
		RecentWorkLogs: workLogs,
		WeeklyHours:    hours,
	}, nil
}
