package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type SystemRepo struct {
	pool *pgxpool.Pool
}

func NewSystemRepo(pool *pgxpool.Pool) *SystemRepo {
	return &SystemRepo{pool: pool}
}

// Settings

func (r *SystemRepo) GetSetting(ctx context.Context, key string) (string, error) {
	var value string
	err := r.pool.QueryRow(ctx,
		`SELECT value FROM system_settings WHERE key = $1`, key,
	).Scan(&value)
	return value, err
}

func (r *SystemRepo) SetSetting(ctx context.Context, key, value string, updatedBy uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO system_settings (key, value, updated_at, updated_by)
		 VALUES ($1, $2, now(), $3)
		 ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now(), updated_by = $3`,
		key, value, updatedBy,
	)
	return err
}

func (r *SystemRepo) GetAllSettings(ctx context.Context) ([]models.SystemSetting, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT key, value, updated_at, updated_by FROM system_settings ORDER BY key`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var settings []models.SystemSetting
	for rows.Next() {
		var s models.SystemSetting
		if err := rows.Scan(&s.Key, &s.Value, &s.UpdatedAt, &s.UpdatedBy); err != nil {
			return nil, err
		}
		settings = append(settings, s)
	}
	if settings == nil {
		settings = []models.SystemSetting{}
	}
	return settings, rows.Err()
}

// Feature toggles

func (r *SystemRepo) ListFeatureToggles(ctx context.Context) ([]models.FeatureToggle, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, module_path, is_enabled, disabled_message, updated_at, updated_by
		 FROM feature_toggles ORDER BY module_path`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var toggles []models.FeatureToggle
	for rows.Next() {
		var t models.FeatureToggle
		if err := rows.Scan(&t.ID, &t.ModulePath, &t.IsEnabled, &t.DisabledMessage, &t.UpdatedAt, &t.UpdatedBy); err != nil {
			return nil, err
		}
		toggles = append(toggles, t)
	}
	if toggles == nil {
		toggles = []models.FeatureToggle{}
	}
	return toggles, rows.Err()
}

func (r *SystemRepo) UpdateFeatureToggle(ctx context.Context, id uuid.UUID, isEnabled bool, message string, updatedBy uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE feature_toggles SET is_enabled = $1, disabled_message = $2, updated_at = now(), updated_by = $3 WHERE id = $4`,
		isEnabled, message, updatedBy, id,
	)
	return err
}

func (r *SystemRepo) GetFeatureToggle(ctx context.Context, modulePath string) (*models.FeatureToggle, error) {
	var t models.FeatureToggle
	err := r.pool.QueryRow(ctx,
		`SELECT id, module_path, is_enabled, disabled_message, updated_at, updated_by
		 FROM feature_toggles WHERE module_path = $1`, modulePath,
	).Scan(&t.ID, &t.ModulePath, &t.IsEnabled, &t.DisabledMessage, &t.UpdatedAt, &t.UpdatedBy)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// Announcement

func (r *SystemRepo) GetAnnouncement(ctx context.Context) (*models.AnnouncementBanner, error) {
	a := &models.AnnouncementBanner{}
	var enabled string
	err := r.pool.QueryRow(ctx, `SELECT value FROM system_settings WHERE key = 'announcement_enabled'`).Scan(&enabled)
	if err != nil {
		return a, nil
	}
	a.Enabled = enabled == "true"
	_ = r.pool.QueryRow(ctx, `SELECT value FROM system_settings WHERE key = 'announcement_message'`).Scan(&a.Message)
	_ = r.pool.QueryRow(ctx, `SELECT value FROM system_settings WHERE key = 'announcement_type'`).Scan(&a.Type)
	return a, nil
}
