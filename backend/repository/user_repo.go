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
		 RETURNING id, email, password_hash, github_id, role, is_active, created_at, updated_at`,
		email, passwordHash,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.GitHubID, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	var u models.User
	err := r.pool.QueryRow(ctx,
		`SELECT id, email, password_hash, github_id, role, is_active, created_at, updated_at
		 FROM users WHERE email = $1`,
		email,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.GitHubID, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) FindByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	var u models.User
	err := r.pool.QueryRow(ctx,
		`SELECT id, email, password_hash, github_id, role, is_active, created_at, updated_at
		 FROM users WHERE id = $1`,
		id,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.GitHubID, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) FindOrCreateByGitHub(ctx context.Context, githubID int64, email string) (*models.User, error) {
	var u models.User
	err := r.pool.QueryRow(ctx,
		`SELECT id, email, password_hash, github_id, role, is_active, created_at, updated_at
		 FROM users WHERE github_id = $1`,
		githubID,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.GitHubID, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err == nil {
		return &u, nil
	}

	err = r.pool.QueryRow(ctx,
		`INSERT INTO users (email, github_id)
		 VALUES ($1, $2)
		 ON CONFLICT (email) DO UPDATE SET github_id = $2, updated_at = now()
		 RETURNING id, email, password_hash, github_id, role, is_active, created_at, updated_at`,
		email, githubID,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.GitHubID, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) ListAll(ctx context.Context) ([]models.AdminUserView, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT u.id, u.email, u.role, u.is_active, p.display_name, p.avatar_url, u.created_at, u.updated_at
		 FROM users u
		 LEFT JOIN profiles p ON p.id = u.id
		 ORDER BY u.created_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.AdminUserView
	for rows.Next() {
		var u models.AdminUserView
		if err := rows.Scan(&u.ID, &u.Email, &u.Role, &u.IsActive, &u.DisplayName, &u.AvatarURL, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	if users == nil {
		users = []models.AdminUserView{}
	}
	return users, rows.Err()
}

func (r *UserRepo) UpdateRole(ctx context.Context, id uuid.UUID, role string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE users SET role = $1, updated_at = now() WHERE id = $2`,
		role, id,
	)
	return err
}

func (r *UserRepo) SetActive(ctx context.Context, id uuid.UUID, isActive bool) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE users SET is_active = $1, updated_at = now() WHERE id = $2`,
		isActive, id,
	)
	return err
}

func (r *UserRepo) Delete(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
