package models

import (
	"time"

	"github.com/google/uuid"
)

type Client struct {
	ID         uuid.UUID `json:"id"`
	UserID     uuid.UUID `json:"user_id"`
	Name       string    `json:"name"`
	Email      string    `json:"email"`
	Company    string    `json:"company"`
	Address    string    `json:"address"`
	Phone      string    `json:"phone"`
	Notes      string    `json:"notes"`
	HourlyRate float64   `json:"hourly_rate"`
	Currency   string    `json:"currency"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type ClientInput struct {
	Name       string  `json:"name"`
	Email      string  `json:"email"`
	Company    string  `json:"company"`
	Address    string  `json:"address"`
	Phone      string  `json:"phone"`
	Notes      string  `json:"notes"`
	HourlyRate float64 `json:"hourly_rate"`
	Currency   string  `json:"currency"`
}

type Project struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"user_id"`
	ClientID    *uuid.UUID `json:"client_id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Color       string     `json:"color"`
	HourlyRate  *float64   `json:"hourly_rate"`
	BudgetHours *float64   `json:"budget_hours"`
	IsArchived  bool       `json:"is_archived"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type ProjectInput struct {
	ClientID    *uuid.UUID `json:"client_id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Color       string     `json:"color"`
	HourlyRate  *float64   `json:"hourly_rate"`
	BudgetHours *float64   `json:"budget_hours"`
}

type TimeEntry struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"user_id"`
	ProjectID   uuid.UUID  `json:"project_id"`
	Description string     `json:"description"`
	StartTime   time.Time  `json:"start_time"`
	EndTime     *time.Time `json:"end_time"`
	Duration    int        `json:"duration"`
	IsBillable  bool       `json:"is_billable"`
	Tags        []string   `json:"tags"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type TimeEntryInput struct {
	ProjectID   uuid.UUID  `json:"project_id"`
	Description string     `json:"description"`
	StartTime   time.Time  `json:"start_time"`
	EndTime     *time.Time `json:"end_time"`
	Duration    int        `json:"duration"`
	IsBillable  bool       `json:"is_billable"`
	Tags        []string   `json:"tags"`
}

type InvoiceLineItem struct {
	Description string  `json:"description"`
	Hours       float64 `json:"hours"`
	Rate        float64 `json:"rate"`
	Amount      float64 `json:"amount"`
}

type Invoice struct {
	ID            uuid.UUID         `json:"id"`
	UserID        uuid.UUID         `json:"user_id"`
	ClientID      *uuid.UUID        `json:"client_id"`
	InvoiceNumber string            `json:"invoice_number"`
	Status        string            `json:"status"`
	IssueDate     string            `json:"issue_date"`
	DueDate       string            `json:"due_date"`
	Subtotal      float64           `json:"subtotal"`
	TaxRate       float64           `json:"tax_rate"`
	TaxAmount     float64           `json:"tax_amount"`
	Total         float64           `json:"total"`
	Currency      string            `json:"currency"`
	Notes         string            `json:"notes"`
	LineItems     []InvoiceLineItem `json:"line_items"`
	PaidAt        *time.Time        `json:"paid_at"`
	CreatedAt     time.Time         `json:"created_at"`
	UpdatedAt     time.Time         `json:"updated_at"`
}

type InvoiceInput struct {
	ClientID  *uuid.UUID        `json:"client_id"`
	DueDate   string            `json:"due_date"`
	TaxRate   float64           `json:"tax_rate"`
	Currency  string            `json:"currency"`
	Notes     string            `json:"notes"`
	LineItems []InvoiceLineItem `json:"line_items"`
}

type TimeReport struct {
	TotalHours    float64              `json:"total_hours"`
	BillableHours float64              `json:"billable_hours"`
	TotalAmount   float64              `json:"total_amount"`
	ByProject     []ProjectTimeSummary `json:"by_project"`
	ByDay         []DailyTimeSummary   `json:"by_day"`
}

type ProjectTimeSummary struct {
	ProjectID   uuid.UUID `json:"project_id"`
	ProjectName string    `json:"project_name"`
	Color       string    `json:"color"`
	Hours       float64   `json:"hours"`
	Amount      float64   `json:"amount"`
}

type DailyTimeSummary struct {
	Date  string  `json:"date"`
	Hours float64 `json:"hours"`
}
