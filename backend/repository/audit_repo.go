package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type AuditRepo struct {
	pool *pgxpool.Pool
}

func NewAuditRepo(pool *pgxpool.Pool) *AuditRepo {
	return &AuditRepo{pool: pool}
}

func (r *AuditRepo) LogVaultAccess(ctx context.Context, vaultID, userID uuid.UUID, action, details, ip string) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO vault_audit_logs (vault_id, user_id, action, details, ip_address)
		 VALUES ($1, $2, $3, $4, $5)`,
		vaultID, userID, action, details, ip,
	)
	return err
}

func (r *AuditRepo) ListVaultLogs(ctx context.Context, vaultID uuid.UUID, limit int) ([]models.VaultAuditLog, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT a.id, a.vault_id, a.user_id, a.action, a.details, a.ip_address,
		        COALESCE(u.email, '') AS user_email,
		        COALESCE(p.display_name, '') AS display_name,
		        a.created_at
		 FROM vault_audit_logs a
		 LEFT JOIN users u ON a.user_id = u.id
		 LEFT JOIN profiles p ON a.user_id = p.id
		 WHERE a.vault_id = $1
		 ORDER BY a.created_at DESC
		 LIMIT $2`, vaultID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.VaultAuditLog
	for rows.Next() {
		var l models.VaultAuditLog
		if err := rows.Scan(&l.ID, &l.VaultID, &l.UserID, &l.Action, &l.Details, &l.IPAddress, &l.UserEmail, &l.DisplayName, &l.CreatedAt); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	if logs == nil {
		logs = []models.VaultAuditLog{}
	}
	return logs, rows.Err()
}

func (r *AuditRepo) ListAllLogs(ctx context.Context, limit int) ([]models.VaultAuditLog, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT a.id, a.vault_id, a.user_id, a.action, a.details, a.ip_address,
		        COALESCE(u.email, '') AS user_email,
		        COALESCE(p.display_name, '') AS display_name,
		        a.created_at
		 FROM vault_audit_logs a
		 LEFT JOIN users u ON a.user_id = u.id
		 LEFT JOIN profiles p ON a.user_id = p.id
		 ORDER BY a.created_at DESC
		 LIMIT $1`, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.VaultAuditLog
	for rows.Next() {
		var l models.VaultAuditLog
		if err := rows.Scan(&l.ID, &l.VaultID, &l.UserID, &l.Action, &l.Details, &l.IPAddress, &l.UserEmail, &l.DisplayName, &l.CreatedAt); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	if logs == nil {
		logs = []models.VaultAuditLog{}
	}
	return logs, rows.Err()
}
