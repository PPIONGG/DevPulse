package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type NavigationRepo struct {
	pool *pgxpool.Pool
}

func NewNavigationRepo(pool *pgxpool.Pool) *NavigationRepo {
	return &NavigationRepo{pool: pool}
}

func (r *NavigationRepo) ListAll(ctx context.Context) ([]models.NavigationItem, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, label, icon, path, is_hidden, min_role, sort_order, group_name, created_at, updated_at
		 FROM navigation_items
		 ORDER BY sort_order ASC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.NavigationItem
	for rows.Next() {
		var i models.NavigationItem
		err := rows.Scan(&i.ID, &i.Label, &i.Icon, &i.Path, &i.IsHidden, &i.MinRole, &i.SortOrder, &i.GroupName, &i.CreatedAt, &i.UpdatedAt)
		if err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

func (r *NavigationRepo) ListVisible(ctx context.Context, userRole string) ([]models.NavigationItem, error) {
	query := `SELECT id, label, icon, path, is_hidden, min_role, sort_order, group_name, created_at, updated_at
	          FROM navigation_items
	          WHERE is_hidden = false`

	if userRole != "admin" {
		query += " AND min_role = 'user'"
	}

	query += " ORDER BY sort_order ASC"

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.NavigationItem
	for rows.Next() {
		var i models.NavigationItem
		err := rows.Scan(&i.ID, &i.Label, &i.Icon, &i.Path, &i.IsHidden, &i.MinRole, &i.SortOrder, &i.GroupName, &i.CreatedAt, &i.UpdatedAt)
		if err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

func (r *NavigationRepo) UpdateVisibility(ctx context.Context, id uuid.UUID, isHidden bool) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE navigation_items SET is_hidden = $1, updated_at = now() WHERE id = $2`,
		isHidden, id,
	)
	return err
}

func (r *NavigationRepo) UpdateGroup(ctx context.Context, id uuid.UUID, groupName string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE navigation_items SET group_name = $1, updated_at = now() WHERE id = $2`,
		groupName, id,
	)
	return err
}

func (r *NavigationRepo) ListGroups(ctx context.Context) ([]string, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT DISTINCT group_name FROM navigation_items ORDER BY group_name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []string
	for rows.Next() {
		var g string
		if err := rows.Scan(&g); err != nil {
			return nil, err
		}
		groups = append(groups, g)
	}
	return groups, rows.Err()
}
