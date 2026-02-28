package models

import (
	"time"

	"github.com/google/uuid"
)

type KanbanBoard struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"user_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	IsFavorite  bool      `json:"is_favorite"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type KanbanBoardInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	IsFavorite  bool   `json:"is_favorite"`
}

type KanbanColumn struct {
	ID        uuid.UUID `json:"id"`
	BoardID   uuid.UUID `json:"board_id"`
	Title     string    `json:"title"`
	Color     string    `json:"color"`
	Position  int       `json:"position"`
	CreatedAt time.Time `json:"created_at"`
}

type KanbanColumnInput struct {
	Title string `json:"title"`
	Color string `json:"color"`
}

type KanbanCard struct {
	ID          uuid.UUID  `json:"id"`
	ColumnID    uuid.UUID  `json:"column_id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Priority    string     `json:"priority"`
	Labels      []string   `json:"labels"`
	Position    int        `json:"position"`
	DueDate     *string    `json:"due_date"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type KanbanCardInput struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Priority    string   `json:"priority"`
	Labels      []string `json:"labels"`
	DueDate     *string  `json:"due_date"`
}

type KanbanColumnWithCards struct {
	KanbanColumn
	Cards []KanbanCard `json:"cards"`
}

type KanbanBoardFull struct {
	KanbanBoard
	Columns []KanbanColumnWithCards `json:"columns"`
}
