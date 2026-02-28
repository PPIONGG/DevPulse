package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type UserRepo struct {
	pool *pgxpool.Pool
}

func NewUserRepo(pool *pgxpool.Pool) *UserRepo {
	return &UserRepo{pool: pool}
}

func (r *UserRepo) Create(ctx context.Context, email, passwordHash string) (*models.User, error) {
	var u models.User
	err := r.pool.QueryRow(ctx,
		`INSERT INTO users (email, password_hash)
		 VALUES ($1, $2)
		 RETURNING id, email, password_hash, github_id, role, created_at, updated_at`,
		email, passwordHash,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.GitHubID, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	var u models.User
	err := r.pool.QueryRow(ctx,
		`SELECT id, email, password_hash, github_id, role, created_at, updated_at
		 FROM users WHERE email = $1`,
		email,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.GitHubID, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) FindByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	var u models.User
	err := r.pool.QueryRow(ctx,
		`SELECT id, email, password_hash, github_id, role, created_at, updated_at
		 FROM users WHERE id = $1`,
		id,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.GitHubID, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) FindOrCreateByGitHub(ctx context.Context, githubID int64, email string) (*models.User, error) {
	// Try to find existing user by GitHub ID
	var u models.User
	err := r.pool.QueryRow(ctx,
		`SELECT id, email, password_hash, github_id, role, created_at, updated_at
		 FROM users WHERE github_id = $1`,
		githubID,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.GitHubID, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if err == nil {
		return &u, nil
	}

	// Create new user with GitHub ID
	err = r.pool.QueryRow(ctx,
		`INSERT INTO users (email, github_id)
		 VALUES ($1, $2)
		 ON CONFLICT (email) DO UPDATE SET github_id = $2, updated_at = now()
		 RETURNING id, email, password_hash, github_id, role, created_at, updated_at`,
		email, githubID,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.GitHubID, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}
