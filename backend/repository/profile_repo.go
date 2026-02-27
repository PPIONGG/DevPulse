package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type ProfileRepo struct {
	pool *pgxpool.Pool
}

func NewProfileRepo(pool *pgxpool.Pool) *ProfileRepo {
	return &ProfileRepo{pool: pool}
}

func (r *ProfileRepo) Upsert(ctx context.Context, userID uuid.UUID, email string) (*models.Profile, error) {
	var p models.Profile
	err := r.pool.QueryRow(ctx,
		`INSERT INTO profiles (id, email)
		 VALUES ($1, $2)
		 ON CONFLICT (id) DO UPDATE SET email = COALESCE(NULLIF($2, ''), profiles.email)
		 RETURNING id, display_name, avatar_url, email`,
		userID, email,
	).Scan(&p.ID, &p.DisplayName, &p.AvatarURL, &p.Email)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *ProfileRepo) FindByID(ctx context.Context, userID uuid.UUID) (*models.Profile, error) {
	var p models.Profile
	err := r.pool.QueryRow(ctx,
		`SELECT id, display_name, avatar_url, email FROM profiles WHERE id = $1`,
		userID,
	).Scan(&p.ID, &p.DisplayName, &p.AvatarURL, &p.Email)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *ProfileRepo) Update(ctx context.Context, userID uuid.UUID, input models.ProfileUpdate) (*models.Profile, error) {
	var p models.Profile
	err := r.pool.QueryRow(ctx,
		`UPDATE profiles
		 SET display_name = COALESCE($2, display_name),
		     avatar_url = COALESCE($3, avatar_url),
		     updated_at = now()
		 WHERE id = $1
		 RETURNING id, display_name, avatar_url, email`,
		userID, input.DisplayName, input.AvatarURL,
	).Scan(&p.ID, &p.DisplayName, &p.AvatarURL, &p.Email)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func ProfileUpdateFromGitHub(displayName, avatarURL string) models.ProfileUpdate {
	return models.ProfileUpdate{
		DisplayName: &displayName,
		AvatarURL:   &avatarURL,
	}
}
