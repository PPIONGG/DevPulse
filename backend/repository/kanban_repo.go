package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type KanbanRepo struct {
	pool *pgxpool.Pool
}

func NewKanbanRepo(pool *pgxpool.Pool) *KanbanRepo {
	return &KanbanRepo{pool: pool}
}

// --- Boards ---

const boardColumns = `id, user_id, title, description, is_favorite, created_at, updated_at`

func scanBoard(scanner interface{ Scan(dest ...any) error }, b *models.KanbanBoard) error {
	return scanner.Scan(&b.ID, &b.UserID, &b.Title, &b.Description, &b.IsFavorite, &b.CreatedAt, &b.UpdatedAt)
}

func (r *KanbanRepo) ListBoards(ctx context.Context, userID uuid.UUID) ([]models.KanbanBoard, error) {
	rows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT %s FROM kanban_boards WHERE user_id = $1 ORDER BY updated_at DESC`, boardColumns),
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var boards []models.KanbanBoard
	for rows.Next() {
		var b models.KanbanBoard
		if err := scanBoard(rows, &b); err != nil {
			return nil, err
		}
		boards = append(boards, b)
	}
	if boards == nil {
		boards = []models.KanbanBoard{}
	}
	return boards, rows.Err()
}

func (r *KanbanRepo) CreateBoard(ctx context.Context, userID uuid.UUID, input models.KanbanBoardInput) (*models.KanbanBoard, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var b models.KanbanBoard
	err = tx.QueryRow(ctx,
		fmt.Sprintf(`INSERT INTO kanban_boards (user_id, title, description, is_favorite)
		 VALUES ($1, $2, $3, $4)
		 RETURNING %s`, boardColumns),
		userID, input.Title, input.Description, input.IsFavorite,
	).Scan(&b.ID, &b.UserID, &b.Title, &b.Description, &b.IsFavorite, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		return nil, err
	}

	// Create default columns
	defaults := []struct {
		title    string
		color    string
		position int
	}{
		{"To Do", "#6b7280", 0},
		{"In Progress", "#3b82f6", 1},
		{"Done", "#10b981", 2},
	}
	for _, d := range defaults {
		_, err := tx.Exec(ctx,
			`INSERT INTO kanban_columns (board_id, title, color, position) VALUES ($1, $2, $3, $4)`,
			b.ID, d.title, d.color, d.position,
		)
		if err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *KanbanRepo) UpdateBoard(ctx context.Context, id, userID uuid.UUID, input models.KanbanBoardInput) (*models.KanbanBoard, error) {
	var b models.KanbanBoard
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE kanban_boards
		 SET title = $3, description = $4, is_favorite = $5, updated_at = now()
		 WHERE id = $1 AND user_id = $2
		 RETURNING %s`, boardColumns),
		id, userID, input.Title, input.Description, input.IsFavorite,
	).Scan(&b.ID, &b.UserID, &b.Title, &b.Description, &b.IsFavorite, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *KanbanRepo) DeleteBoard(ctx context.Context, id, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM kanban_boards WHERE id = $1 AND user_id = $2`,
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

func (r *KanbanRepo) CountBoards(ctx context.Context, userID uuid.UUID) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM kanban_boards WHERE user_id = $1`, userID).Scan(&count)
	return count, err
}

// --- Board Full (columns + cards) ---

func (r *KanbanRepo) GetBoardFull(ctx context.Context, boardID, userID uuid.UUID) (*models.KanbanBoardFull, error) {
	// Get board
	var b models.KanbanBoard
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT %s FROM kanban_boards WHERE id = $1 AND user_id = $2`, boardColumns),
		boardID, userID,
	).Scan(&b.ID, &b.UserID, &b.Title, &b.Description, &b.IsFavorite, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		return nil, err
	}

	// Get columns
	colRows, err := r.pool.Query(ctx,
		`SELECT id, board_id, title, color, position, created_at
		 FROM kanban_columns WHERE board_id = $1 ORDER BY position ASC`,
		boardID,
	)
	if err != nil {
		return nil, err
	}
	defer colRows.Close()

	var columns []models.KanbanColumnWithCards
	colMap := make(map[uuid.UUID]int)
	for colRows.Next() {
		var c models.KanbanColumn
		if err := colRows.Scan(&c.ID, &c.BoardID, &c.Title, &c.Color, &c.Position, &c.CreatedAt); err != nil {
			return nil, err
		}
		colMap[c.ID] = len(columns)
		columns = append(columns, models.KanbanColumnWithCards{KanbanColumn: c, Cards: []models.KanbanCard{}})
	}
	if err := colRows.Err(); err != nil {
		return nil, err
	}

	// Get cards for all columns
	if len(columns) > 0 {
		colIDs := make([]uuid.UUID, len(columns))
		for i, c := range columns {
			colIDs[i] = c.ID
		}
		cardRows, err := r.pool.Query(ctx,
			`SELECT id, column_id, title, description, priority, labels, position, due_date::text, created_at, updated_at
			 FROM kanban_cards WHERE column_id = ANY($1) ORDER BY position ASC`,
			colIDs,
		)
		if err != nil {
			return nil, err
		}
		defer cardRows.Close()

		for cardRows.Next() {
			var c models.KanbanCard
			if err := cardRows.Scan(&c.ID, &c.ColumnID, &c.Title, &c.Description, &c.Priority, &c.Labels, &c.Position, &c.DueDate, &c.CreatedAt, &c.UpdatedAt); err != nil {
				return nil, err
			}
			if idx, ok := colMap[c.ColumnID]; ok {
				columns[idx].Cards = append(columns[idx].Cards, c)
			}
		}
		if err := cardRows.Err(); err != nil {
			return nil, err
		}
	}

	if columns == nil {
		columns = []models.KanbanColumnWithCards{}
	}

	return &models.KanbanBoardFull{
		KanbanBoard: b,
		Columns:     columns,
	}, nil
}

// --- Columns ---

func (r *KanbanRepo) verifyBoardOwner(ctx context.Context, boardID, userID uuid.UUID) error {
	var exists bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM kanban_boards WHERE id = $1 AND user_id = $2)`,
		boardID, userID,
	).Scan(&exists)
	if err != nil {
		return err
	}
	if !exists {
		return ErrNotFound
	}
	return nil
}

func (r *KanbanRepo) CreateColumn(ctx context.Context, boardID, userID uuid.UUID, input models.KanbanColumnInput) (*models.KanbanColumn, error) {
	if err := r.verifyBoardOwner(ctx, boardID, userID); err != nil {
		return nil, err
	}

	// Get next position
	var maxPos *int
	r.pool.QueryRow(ctx, `SELECT MAX(position) FROM kanban_columns WHERE board_id = $1`, boardID).Scan(&maxPos)
	pos := 0
	if maxPos != nil {
		pos = *maxPos + 1
	}

	var c models.KanbanColumn
	err := r.pool.QueryRow(ctx,
		`INSERT INTO kanban_columns (board_id, title, color, position)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, board_id, title, color, position, created_at`,
		boardID, input.Title, input.Color, pos,
	).Scan(&c.ID, &c.BoardID, &c.Title, &c.Color, &c.Position, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *KanbanRepo) UpdateColumn(ctx context.Context, colID, userID uuid.UUID, input models.KanbanColumnInput) (*models.KanbanColumn, error) {
	var c models.KanbanColumn
	err := r.pool.QueryRow(ctx,
		`UPDATE kanban_columns SET title = $3, color = $4
		 WHERE id = $1 AND EXISTS(
		   SELECT 1 FROM kanban_boards WHERE id = kanban_columns.board_id AND user_id = $2
		 )
		 RETURNING id, board_id, title, color, position, created_at`,
		colID, userID, input.Title, input.Color,
	).Scan(&c.ID, &c.BoardID, &c.Title, &c.Color, &c.Position, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *KanbanRepo) DeleteColumn(ctx context.Context, colID, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM kanban_columns
		 WHERE id = $1 AND EXISTS(
		   SELECT 1 FROM kanban_boards WHERE id = kanban_columns.board_id AND user_id = $2
		 )`,
		colID, userID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// --- Cards ---

func (r *KanbanRepo) CreateCard(ctx context.Context, colID, userID uuid.UUID, input models.KanbanCardInput) (*models.KanbanCard, error) {
	// Verify ownership
	var exists bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS(
		   SELECT 1 FROM kanban_columns c
		   JOIN kanban_boards b ON b.id = c.board_id
		   WHERE c.id = $1 AND b.user_id = $2
		 )`, colID, userID,
	).Scan(&exists)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrNotFound
	}

	var maxPos *int
	r.pool.QueryRow(ctx, `SELECT MAX(position) FROM kanban_cards WHERE column_id = $1`, colID).Scan(&maxPos)
	pos := 0
	if maxPos != nil {
		pos = *maxPos + 1
	}

	if input.Labels == nil {
		input.Labels = []string{}
	}

	var c models.KanbanCard
	err = r.pool.QueryRow(ctx,
		`INSERT INTO kanban_cards (column_id, title, description, priority, labels, position, due_date)
		 VALUES ($1, $2, $3, $4, $5, $6, $7::date)
		 RETURNING id, column_id, title, description, priority, labels, position, due_date::text, created_at, updated_at`,
		colID, input.Title, input.Description, input.Priority, input.Labels, pos, input.DueDate,
	).Scan(&c.ID, &c.ColumnID, &c.Title, &c.Description, &c.Priority, &c.Labels, &c.Position, &c.DueDate, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *KanbanRepo) UpdateCard(ctx context.Context, cardID, userID uuid.UUID, input models.KanbanCardInput) (*models.KanbanCard, error) {
	if input.Labels == nil {
		input.Labels = []string{}
	}
	var c models.KanbanCard
	err := r.pool.QueryRow(ctx,
		`UPDATE kanban_cards SET title = $3, description = $4, priority = $5, labels = $6, due_date = $7::date, updated_at = now()
		 WHERE id = $1 AND EXISTS(
		   SELECT 1 FROM kanban_columns col
		   JOIN kanban_boards b ON b.id = col.board_id
		   WHERE col.id = kanban_cards.column_id AND b.user_id = $2
		 )
		 RETURNING id, column_id, title, description, priority, labels, position, due_date::text, created_at, updated_at`,
		cardID, userID, input.Title, input.Description, input.Priority, input.Labels, input.DueDate,
	).Scan(&c.ID, &c.ColumnID, &c.Title, &c.Description, &c.Priority, &c.Labels, &c.Position, &c.DueDate, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *KanbanRepo) DeleteCard(ctx context.Context, cardID, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM kanban_cards
		 WHERE id = $1 AND EXISTS(
		   SELECT 1 FROM kanban_columns col
		   JOIN kanban_boards b ON b.id = col.board_id
		   WHERE col.id = kanban_cards.column_id AND b.user_id = $2
		 )`,
		cardID, userID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

type CardPosition struct {
	ID       uuid.UUID `json:"id"`
	ColumnID uuid.UUID `json:"column_id"`
	Position int       `json:"position"`
}

func (r *KanbanRepo) ReorderCards(ctx context.Context, userID uuid.UUID, updates []CardPosition) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	for _, u := range updates {
		tag, err := tx.Exec(ctx,
			`UPDATE kanban_cards SET column_id = $2, position = $3, updated_at = now()
			 WHERE id = $1 AND EXISTS(
			   SELECT 1 FROM kanban_columns col
			   JOIN kanban_boards b ON b.id = col.board_id
			   WHERE col.id = $2 AND b.user_id = $4
			 )`,
			u.ID, u.ColumnID, u.Position, userID,
		)
		if err != nil {
			return err
		}
		if tag.RowsAffected() == 0 {
			return ErrNotFound
		}
	}

	return tx.Commit(ctx)
}
