package repository

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type SessionRepo struct {
	pool *pgxpool.Pool
}

func NewSessionRepo(pool *pgxpool.Pool) *SessionRepo {
	return &SessionRepo{pool: pool}
}

func (r *SessionRepo) Create(ctx context.Context, userID uuid.UUID) (*models.Session, error) {
	token, err := generateToken()
	if err != nil {
		return nil, err
	}

	var role string
	err = r.pool.QueryRow(ctx, `SELECT role FROM users WHERE id = $1`, userID).Scan(&role)
	if err != nil {
		return nil, err
	}

	s := &models.Session{
		Token:     token,
		UserID:    userID,
		UserRole:  role,
		ExpiresAt: time.Now().Add(30 * 24 * time.Hour),
	}

	_, err = r.pool.Exec(ctx,
		`INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)`,
		s.Token, s.UserID, s.ExpiresAt,
	)
	if err != nil {
		return nil, err
	}

	return s, nil
}

func (r *SessionRepo) FindValid(ctx context.Context, token string) (*models.Session, error) {
	var s models.Session
	var isActive bool
	err := r.pool.QueryRow(ctx,
		`SELECT s.token, s.user_id, u.role, s.expires_at, s.created_at, u.is_active
		 FROM sessions s
		 JOIN users u ON s.user_id = u.id
		 WHERE s.token = $1 AND s.expires_at > now()`,
		token,
	).Scan(&s.Token, &s.UserID, &s.UserRole, &s.ExpiresAt, &s.CreatedAt, &isActive)
	if err != nil {
		return nil, err
	}
	if !isActive {
		return nil, ErrNotFound
	}
	return &s, nil
}

func (r *SessionRepo) Delete(ctx context.Context, token string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM sessions WHERE token = $1`, token)
	return err
}

func (r *SessionRepo) DeleteExpired(ctx context.Context) (int64, error) {
	tag, err := r.pool.Exec(ctx, `DELETE FROM sessions WHERE expires_at <= now()`)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}

func (r *SessionRepo) DeleteByUserID(ctx context.Context, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM sessions WHERE user_id = $1`, userID)
	return err
}

func generateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
