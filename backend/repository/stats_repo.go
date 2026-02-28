package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type StatsRepo struct {
	pool *pgxpool.Pool
}

func NewStatsRepo(pool *pgxpool.Pool) *StatsRepo {
	return &StatsRepo{pool: pool}
}

func (r *StatsRepo) GetSystemStats(ctx context.Context) (*models.SystemStats, error) {
	stats := &models.SystemStats{}

	_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&stats.TotalUsers)
	_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE is_active = true`).Scan(&stats.ActiveUsers)
	_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM snippets`).Scan(&stats.TotalSnippets)
	_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM expenses`).Scan(&stats.TotalExpenses)
	_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM habits`).Scan(&stats.TotalHabits)
	_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM kanban_boards`).Scan(&stats.TotalBoards)
	_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM env_vaults`).Scan(&stats.TotalVaults)
	_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM sql_challenges`).Scan(&stats.TotalChallenges)
	_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM sessions WHERE expires_at > now()`).Scan(&stats.TotalSessions)

	// User growth over last 30 days
	growthRows, err := r.pool.Query(ctx,
		`SELECT created_at::date AS d, COUNT(*) AS c
		 FROM users
		 WHERE created_at >= now() - interval '30 days'
		 GROUP BY d ORDER BY d`)
	if err == nil {
		defer growthRows.Close()
		for growthRows.Next() {
			var s models.DailyCountStat
			if err := growthRows.Scan(&s.Date, &s.Count); err == nil {
				stats.UserGrowth = append(stats.UserGrowth, s)
			}
		}
	}
	if stats.UserGrowth == nil {
		stats.UserGrowth = []models.DailyCountStat{}
	}

	// Feature usage (count of rows per feature table)
	featureQueries := []struct {
		name  string
		query string
	}{
		{"Snippets", "SELECT COUNT(*) FROM snippets"},
		{"Expenses", "SELECT COUNT(*) FROM expenses"},
		{"Habits", "SELECT COUNT(*) FROM habits"},
		{"Kanban Boards", "SELECT COUNT(*) FROM kanban_boards"},
		{"Pomodoro Sessions", "SELECT COUNT(*) FROM pomodoro_sessions"},
		{"Env Vaults", "SELECT COUNT(*) FROM env_vaults"},
		{"JSON Documents", "SELECT COUNT(*) FROM json_documents"},
		{"SQL Submissions", "SELECT COUNT(*) FROM sql_submissions"},
		{"Calculations", "SELECT COUNT(*) FROM calculations"},
	}

	for _, fq := range featureQueries {
		var count int
		if err := r.pool.QueryRow(ctx, fq.query).Scan(&count); err == nil {
			stats.FeatureUsage = append(stats.FeatureUsage, models.FeatureUsageStat{
				Feature: fq.name,
				Count:   count,
			})
		}
	}
	if stats.FeatureUsage == nil {
		stats.FeatureUsage = []models.FeatureUsageStat{}
	}

	return stats, nil
}
