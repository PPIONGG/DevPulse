package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type ExpenseRepo struct {
	pool *pgxpool.Pool
}

func NewExpenseRepo(pool *pgxpool.Pool) *ExpenseRepo {
	return &ExpenseRepo{pool: pool}
}

const expenseColumns = `id, user_id, title, amount::float8, currency, category, date::text, notes, is_recurring, created_at, updated_at`

func scanExpense(scanner interface{ Scan(dest ...any) error }, e *models.Expense) error {
	return scanner.Scan(&e.ID, &e.UserID, &e.Title, &e.Amount, &e.Currency, &e.Category, &e.Date, &e.Notes, &e.IsRecurring, &e.CreatedAt, &e.UpdatedAt)
}

func (r *ExpenseRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]models.Expense, error) {
	rows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT %s FROM expenses WHERE user_id = $1 ORDER BY date DESC, created_at DESC`, expenseColumns),
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var expenses []models.Expense
	for rows.Next() {
		var e models.Expense
		if err := scanExpense(rows, &e); err != nil {
			return nil, err
		}
		expenses = append(expenses, e)
	}
	if expenses == nil {
		expenses = []models.Expense{}
	}
	return expenses, rows.Err()
}

func (r *ExpenseRepo) Create(ctx context.Context, userID uuid.UUID, input models.ExpenseInput) (*models.Expense, error) {
	var e models.Expense
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`INSERT INTO expenses (user_id, title, amount, currency, category, date, notes, is_recurring)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING %s`, expenseColumns),
		userID, input.Title, input.Amount, input.Currency, input.Category, input.Date, input.Notes, input.IsRecurring,
	).Scan(&e.ID, &e.UserID, &e.Title, &e.Amount, &e.Currency, &e.Category, &e.Date, &e.Notes, &e.IsRecurring, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *ExpenseRepo) Update(ctx context.Context, id, userID uuid.UUID, input models.ExpenseInput) (*models.Expense, error) {
	var e models.Expense
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE expenses
		 SET title = $3, amount = $4, currency = $5, category = $6, date = $7, notes = $8, is_recurring = $9, updated_at = now()
		 WHERE id = $1 AND user_id = $2
		 RETURNING %s`, expenseColumns),
		id, userID, input.Title, input.Amount, input.Currency, input.Category, input.Date, input.Notes, input.IsRecurring,
	).Scan(&e.ID, &e.UserID, &e.Title, &e.Amount, &e.Currency, &e.Category, &e.Date, &e.Notes, &e.IsRecurring, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *ExpenseRepo) CountByUser(ctx context.Context, userID uuid.UUID) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM expenses WHERE user_id = $1`, userID).Scan(&count)
	return count, err
}

func (r *ExpenseRepo) Delete(ctx context.Context, id, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM expenses WHERE id = $1 AND user_id = $2`,
		id, userID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
