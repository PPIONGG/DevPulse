package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

// ─── ClientRepo ───

type ClientRepo struct {
	pool *pgxpool.Pool
}

func NewClientRepo(pool *pgxpool.Pool) *ClientRepo {
	return &ClientRepo{pool: pool}
}

const clientColumns = `id, user_id, name, email, company, address, phone, notes, hourly_rate::float8, currency, created_at, updated_at`

func scanClient(scanner interface{ Scan(dest ...any) error }, c *models.Client) error {
	return scanner.Scan(&c.ID, &c.UserID, &c.Name, &c.Email, &c.Company, &c.Address, &c.Phone, &c.Notes, &c.HourlyRate, &c.Currency, &c.CreatedAt, &c.UpdatedAt)
}

func (r *ClientRepo) List(ctx context.Context, userID uuid.UUID) ([]models.Client, error) {
	rows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT %s FROM clients WHERE user_id = $1 ORDER BY name ASC`, clientColumns),
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var clients []models.Client
	for rows.Next() {
		var c models.Client
		if err := scanClient(rows, &c); err != nil {
			return nil, err
		}
		clients = append(clients, c)
	}
	if clients == nil {
		clients = []models.Client{}
	}
	return clients, rows.Err()
}

func (r *ClientRepo) Create(ctx context.Context, userID uuid.UUID, input models.ClientInput) (*models.Client, error) {
	var c models.Client
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`INSERT INTO clients (user_id, name, email, company, address, phone, notes, hourly_rate, currency)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		 RETURNING %s`, clientColumns),
		userID, input.Name, input.Email, input.Company, input.Address, input.Phone, input.Notes, input.HourlyRate, input.Currency,
	).Scan(&c.ID, &c.UserID, &c.Name, &c.Email, &c.Company, &c.Address, &c.Phone, &c.Notes, &c.HourlyRate, &c.Currency, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *ClientRepo) Update(ctx context.Context, id, userID uuid.UUID, input models.ClientInput) (*models.Client, error) {
	var c models.Client
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE clients
		 SET name = $3, email = $4, company = $5, address = $6, phone = $7, notes = $8, hourly_rate = $9, currency = $10, updated_at = now()
		 WHERE id = $1 AND user_id = $2
		 RETURNING %s`, clientColumns),
		id, userID, input.Name, input.Email, input.Company, input.Address, input.Phone, input.Notes, input.HourlyRate, input.Currency,
	).Scan(&c.ID, &c.UserID, &c.Name, &c.Email, &c.Company, &c.Address, &c.Phone, &c.Notes, &c.HourlyRate, &c.Currency, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *ClientRepo) Delete(ctx context.Context, id, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM clients WHERE id = $1 AND user_id = $2`,
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

// ─── ProjectRepo ───

type ProjectRepo struct {
	pool *pgxpool.Pool
}

func NewProjectRepo(pool *pgxpool.Pool) *ProjectRepo {
	return &ProjectRepo{pool: pool}
}

const projectColumns = `id, user_id, client_id, title, description, color, hourly_rate::float8, budget_hours::float8, is_archived, created_at, updated_at`

func scanProject(scanner interface{ Scan(dest ...any) error }, p *models.Project) error {
	return scanner.Scan(&p.ID, &p.UserID, &p.ClientID, &p.Title, &p.Description, &p.Color, &p.HourlyRate, &p.BudgetHours, &p.IsArchived, &p.CreatedAt, &p.UpdatedAt)
}

func (r *ProjectRepo) List(ctx context.Context, userID uuid.UUID) ([]models.Project, error) {
	rows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT %s FROM projects WHERE user_id = $1 AND is_archived = false ORDER BY title ASC`, projectColumns),
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []models.Project
	for rows.Next() {
		var p models.Project
		if err := scanProject(rows, &p); err != nil {
			return nil, err
		}
		projects = append(projects, p)
	}
	if projects == nil {
		projects = []models.Project{}
	}
	return projects, rows.Err()
}

func (r *ProjectRepo) ListAll(ctx context.Context, userID uuid.UUID) ([]models.Project, error) {
	rows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT %s FROM projects WHERE user_id = $1 ORDER BY is_archived ASC, title ASC`, projectColumns),
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []models.Project
	for rows.Next() {
		var p models.Project
		if err := scanProject(rows, &p); err != nil {
			return nil, err
		}
		projects = append(projects, p)
	}
	if projects == nil {
		projects = []models.Project{}
	}
	return projects, rows.Err()
}

func (r *ProjectRepo) Create(ctx context.Context, userID uuid.UUID, input models.ProjectInput) (*models.Project, error) {
	var p models.Project
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`INSERT INTO projects (user_id, client_id, title, description, color, hourly_rate, budget_hours)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING %s`, projectColumns),
		userID, input.ClientID, input.Title, input.Description, input.Color, input.HourlyRate, input.BudgetHours,
	).Scan(&p.ID, &p.UserID, &p.ClientID, &p.Title, &p.Description, &p.Color, &p.HourlyRate, &p.BudgetHours, &p.IsArchived, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *ProjectRepo) Update(ctx context.Context, id, userID uuid.UUID, input models.ProjectInput) (*models.Project, error) {
	var p models.Project
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE projects
		 SET client_id = $3, title = $4, description = $5, color = $6, hourly_rate = $7, budget_hours = $8, updated_at = now()
		 WHERE id = $1 AND user_id = $2
		 RETURNING %s`, projectColumns),
		id, userID, input.ClientID, input.Title, input.Description, input.Color, input.HourlyRate, input.BudgetHours,
	).Scan(&p.ID, &p.UserID, &p.ClientID, &p.Title, &p.Description, &p.Color, &p.HourlyRate, &p.BudgetHours, &p.IsArchived, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *ProjectRepo) Archive(ctx context.Context, id, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE projects SET is_archived = NOT is_archived, updated_at = now() WHERE id = $1 AND user_id = $2`,
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

func (r *ProjectRepo) Delete(ctx context.Context, id, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM projects WHERE id = $1 AND user_id = $2`,
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

// ─── TimeEntryRepo ───

type TimeEntryRepo struct {
	pool *pgxpool.Pool
}

func NewTimeEntryRepo(pool *pgxpool.Pool) *TimeEntryRepo {
	return &TimeEntryRepo{pool: pool}
}

const timeEntryColumns = `id, user_id, project_id, description, start_time, end_time, duration, is_billable, tags, created_at, updated_at`

func scanTimeEntry(scanner interface{ Scan(dest ...any) error }, e *models.TimeEntry) error {
	return scanner.Scan(&e.ID, &e.UserID, &e.ProjectID, &e.Description, &e.StartTime, &e.EndTime, &e.Duration, &e.IsBillable, &e.Tags, &e.CreatedAt, &e.UpdatedAt)
}

func (r *TimeEntryRepo) List(ctx context.Context, userID uuid.UUID, projectID *uuid.UUID, dateFrom, dateTo string) ([]models.TimeEntry, error) {
	query := fmt.Sprintf(`SELECT %s FROM time_entries WHERE user_id = $1`, timeEntryColumns)
	args := []any{userID}
	argIdx := 2

	if projectID != nil {
		query += fmt.Sprintf(` AND project_id = $%d`, argIdx)
		args = append(args, *projectID)
		argIdx++
	}
	if dateFrom != "" {
		query += fmt.Sprintf(` AND start_time >= $%d::timestamptz`, argIdx)
		args = append(args, dateFrom)
		argIdx++
	}
	if dateTo != "" {
		query += fmt.Sprintf(` AND start_time < ($%d::date + 1)::timestamptz`, argIdx)
		args = append(args, dateTo)
		argIdx++
	}
	query += ` ORDER BY start_time DESC`

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []models.TimeEntry
	for rows.Next() {
		var e models.TimeEntry
		if err := scanTimeEntry(rows, &e); err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}
	if entries == nil {
		entries = []models.TimeEntry{}
	}
	return entries, rows.Err()
}

func (r *TimeEntryRepo) GetRunning(ctx context.Context, userID uuid.UUID) (*models.TimeEntry, error) {
	var e models.TimeEntry
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT %s FROM time_entries WHERE user_id = $1 AND end_time IS NULL LIMIT 1`, timeEntryColumns),
		userID,
	).Scan(&e.ID, &e.UserID, &e.ProjectID, &e.Description, &e.StartTime, &e.EndTime, &e.Duration, &e.IsBillable, &e.Tags, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *TimeEntryRepo) Create(ctx context.Context, userID uuid.UUID, input models.TimeEntryInput) (*models.TimeEntry, error) {
	if input.Tags == nil {
		input.Tags = []string{}
	}
	var e models.TimeEntry
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`INSERT INTO time_entries (user_id, project_id, description, start_time, end_time, duration, is_billable, tags)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING %s`, timeEntryColumns),
		userID, input.ProjectID, input.Description, input.StartTime, input.EndTime, input.Duration, input.IsBillable, input.Tags,
	).Scan(&e.ID, &e.UserID, &e.ProjectID, &e.Description, &e.StartTime, &e.EndTime, &e.Duration, &e.IsBillable, &e.Tags, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *TimeEntryRepo) Update(ctx context.Context, id, userID uuid.UUID, input models.TimeEntryInput) (*models.TimeEntry, error) {
	if input.Tags == nil {
		input.Tags = []string{}
	}
	var e models.TimeEntry
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE time_entries
		 SET project_id = $3, description = $4, start_time = $5, end_time = $6, duration = $7, is_billable = $8, tags = $9, updated_at = now()
		 WHERE id = $1 AND user_id = $2
		 RETURNING %s`, timeEntryColumns),
		id, userID, input.ProjectID, input.Description, input.StartTime, input.EndTime, input.Duration, input.IsBillable, input.Tags,
	).Scan(&e.ID, &e.UserID, &e.ProjectID, &e.Description, &e.StartTime, &e.EndTime, &e.Duration, &e.IsBillable, &e.Tags, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *TimeEntryRepo) Stop(ctx context.Context, id, userID uuid.UUID) (*models.TimeEntry, error) {
	var e models.TimeEntry
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE time_entries
		 SET end_time = now(), duration = EXTRACT(EPOCH FROM now() - start_time)::integer, updated_at = now()
		 WHERE id = $1 AND user_id = $2 AND end_time IS NULL
		 RETURNING %s`, timeEntryColumns),
		id, userID,
	).Scan(&e.ID, &e.UserID, &e.ProjectID, &e.Description, &e.StartTime, &e.EndTime, &e.Duration, &e.IsBillable, &e.Tags, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *TimeEntryRepo) Delete(ctx context.Context, id, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM time_entries WHERE id = $1 AND user_id = $2`,
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

func (r *TimeEntryRepo) GetReport(ctx context.Context, userID uuid.UUID, dateFrom, dateTo string) (*models.TimeReport, error) {
	report := &models.TimeReport{}

	// Total and billable hours
	err := r.pool.QueryRow(ctx,
		`SELECT COALESCE(SUM(duration) / 3600.0, 0),
		        COALESCE(SUM(CASE WHEN is_billable THEN duration ELSE 0 END) / 3600.0, 0)
		 FROM time_entries
		 WHERE user_id = $1 AND end_time IS NOT NULL
		   AND start_time >= $2::timestamptz AND start_time < ($3::date + 1)::timestamptz`,
		userID, dateFrom, dateTo,
	).Scan(&report.TotalHours, &report.BillableHours)
	if err != nil {
		return nil, err
	}

	// By project
	rows, err := r.pool.Query(ctx,
		`SELECT p.id, p.title, p.color,
		        COALESCE(SUM(te.duration) / 3600.0, 0) AS hours,
		        COALESCE(SUM(CASE WHEN te.is_billable THEN te.duration / 3600.0 * COALESCE(p.hourly_rate, c.hourly_rate, 0) ELSE 0 END), 0) AS amount
		 FROM time_entries te
		 JOIN projects p ON p.id = te.project_id
		 LEFT JOIN clients c ON c.id = p.client_id
		 WHERE te.user_id = $1 AND te.end_time IS NOT NULL
		   AND te.start_time >= $2::timestamptz AND te.start_time < ($3::date + 1)::timestamptz
		 GROUP BY p.id, p.title, p.color
		 ORDER BY hours DESC`,
		userID, dateFrom, dateTo,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var totalAmount float64
	for rows.Next() {
		var s models.ProjectTimeSummary
		if err := rows.Scan(&s.ProjectID, &s.ProjectName, &s.Color, &s.Hours, &s.Amount); err != nil {
			return nil, err
		}
		totalAmount += s.Amount
		report.ByProject = append(report.ByProject, s)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	report.TotalAmount = totalAmount

	if report.ByProject == nil {
		report.ByProject = []models.ProjectTimeSummary{}
	}

	// By day
	dayRows, err := r.pool.Query(ctx,
		`SELECT DATE(start_time)::text AS date, COALESCE(SUM(duration) / 3600.0, 0) AS hours
		 FROM time_entries
		 WHERE user_id = $1 AND end_time IS NOT NULL
		   AND start_time >= $2::timestamptz AND start_time < ($3::date + 1)::timestamptz
		 GROUP BY DATE(start_time)
		 ORDER BY date`,
		userID, dateFrom, dateTo,
	)
	if err != nil {
		return nil, err
	}
	defer dayRows.Close()

	for dayRows.Next() {
		var d models.DailyTimeSummary
		if err := dayRows.Scan(&d.Date, &d.Hours); err != nil {
			return nil, err
		}
		report.ByDay = append(report.ByDay, d)
	}
	if err := dayRows.Err(); err != nil {
		return nil, err
	}

	if report.ByDay == nil {
		report.ByDay = []models.DailyTimeSummary{}
	}

	return report, nil
}

// ─── InvoiceRepo ───

type InvoiceRepo struct {
	pool *pgxpool.Pool
}

func NewInvoiceRepo(pool *pgxpool.Pool) *InvoiceRepo {
	return &InvoiceRepo{pool: pool}
}

const invoiceColumns = `id, user_id, client_id, invoice_number, status, issue_date::text, due_date::text, subtotal::float8, tax_rate::float8, tax_amount::float8, total::float8, currency, notes, line_items, paid_at, created_at, updated_at`

func scanInvoice(scanner interface{ Scan(dest ...any) error }, inv *models.Invoice) error {
	var lineItemsJSON []byte
	err := scanner.Scan(&inv.ID, &inv.UserID, &inv.ClientID, &inv.InvoiceNumber, &inv.Status, &inv.IssueDate, &inv.DueDate, &inv.Subtotal, &inv.TaxRate, &inv.TaxAmount, &inv.Total, &inv.Currency, &inv.Notes, &lineItemsJSON, &inv.PaidAt, &inv.CreatedAt, &inv.UpdatedAt)
	if err != nil {
		return err
	}
	if err := json.Unmarshal(lineItemsJSON, &inv.LineItems); err != nil {
		inv.LineItems = []models.InvoiceLineItem{}
	}
	return nil
}

func (r *InvoiceRepo) List(ctx context.Context, userID uuid.UUID) ([]models.Invoice, error) {
	rows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT %s FROM invoices WHERE user_id = $1 ORDER BY created_at DESC`, invoiceColumns),
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invoices []models.Invoice
	for rows.Next() {
		var inv models.Invoice
		if err := scanInvoice(rows, &inv); err != nil {
			return nil, err
		}
		invoices = append(invoices, inv)
	}
	if invoices == nil {
		invoices = []models.Invoice{}
	}
	return invoices, rows.Err()
}

func (r *InvoiceRepo) GetByID(ctx context.Context, id, userID uuid.UUID) (*models.Invoice, error) {
	var inv models.Invoice
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT %s FROM invoices WHERE id = $1 AND user_id = $2`, invoiceColumns),
		id, userID,
	)
	if scanErr := scanInvoice(err, &inv); scanErr != nil {
		return nil, scanErr
	}
	return &inv, nil
}

func (r *InvoiceRepo) NextInvoiceNumber(ctx context.Context) (string, error) {
	var seq int
	err := r.pool.QueryRow(ctx, `SELECT nextval('invoice_number_seq')`).Scan(&seq)
	if err != nil {
		return "", err
	}
	year := time.Now().Year()
	return fmt.Sprintf("INV-%d-%03d", year, seq), nil
}

func (r *InvoiceRepo) Create(ctx context.Context, userID uuid.UUID, input models.InvoiceInput) (*models.Invoice, error) {
	invoiceNumber, err := r.NextInvoiceNumber(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to generate invoice number: %w", err)
	}

	if input.LineItems == nil {
		input.LineItems = []models.InvoiceLineItem{}
	}

	// Compute totals
	var subtotal float64
	for _, li := range input.LineItems {
		subtotal += li.Amount
	}
	taxAmount := subtotal * input.TaxRate / 100
	total := subtotal + taxAmount

	lineItemsJSON, err := json.Marshal(input.LineItems)
	if err != nil {
		return nil, err
	}

	var inv models.Invoice
	var lineItemsOut []byte
	err = r.pool.QueryRow(ctx,
		`INSERT INTO invoices (user_id, client_id, invoice_number, due_date, subtotal, tax_rate, tax_amount, total, currency, notes, line_items)
		 VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8, $9, $10, $11)
		 RETURNING `+invoiceColumns,
		userID, input.ClientID, invoiceNumber, input.DueDate, subtotal, input.TaxRate, taxAmount, total, input.Currency, input.Notes, lineItemsJSON,
	).Scan(&inv.ID, &inv.UserID, &inv.ClientID, &inv.InvoiceNumber, &inv.Status, &inv.IssueDate, &inv.DueDate, &inv.Subtotal, &inv.TaxRate, &inv.TaxAmount, &inv.Total, &inv.Currency, &inv.Notes, &lineItemsOut, &inv.PaidAt, &inv.CreatedAt, &inv.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(lineItemsOut, &inv.LineItems); err != nil {
		inv.LineItems = []models.InvoiceLineItem{}
	}
	return &inv, nil
}

func (r *InvoiceRepo) Update(ctx context.Context, id, userID uuid.UUID, input models.InvoiceInput) (*models.Invoice, error) {
	if input.LineItems == nil {
		input.LineItems = []models.InvoiceLineItem{}
	}

	var subtotal float64
	for _, li := range input.LineItems {
		subtotal += li.Amount
	}
	taxAmount := subtotal * input.TaxRate / 100
	total := subtotal + taxAmount

	lineItemsJSON, err := json.Marshal(input.LineItems)
	if err != nil {
		return nil, err
	}

	var inv models.Invoice
	var lineItemsOut []byte
	err = r.pool.QueryRow(ctx,
		`UPDATE invoices
		 SET client_id = $3, due_date = $4::date, subtotal = $5, tax_rate = $6, tax_amount = $7, total = $8, currency = $9, notes = $10, line_items = $11, updated_at = now()
		 WHERE id = $1 AND user_id = $2 AND status = 'draft'
		 RETURNING `+invoiceColumns,
		id, userID, input.ClientID, input.DueDate, subtotal, input.TaxRate, taxAmount, total, input.Currency, input.Notes, lineItemsJSON,
	).Scan(&inv.ID, &inv.UserID, &inv.ClientID, &inv.InvoiceNumber, &inv.Status, &inv.IssueDate, &inv.DueDate, &inv.Subtotal, &inv.TaxRate, &inv.TaxAmount, &inv.Total, &inv.Currency, &inv.Notes, &lineItemsOut, &inv.PaidAt, &inv.CreatedAt, &inv.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(lineItemsOut, &inv.LineItems); err != nil {
		inv.LineItems = []models.InvoiceLineItem{}
	}
	return &inv, nil
}

func (r *InvoiceRepo) UpdateStatus(ctx context.Context, id, userID uuid.UUID, status string) (*models.Invoice, error) {
	var inv models.Invoice
	var lineItemsOut []byte

	paidAt := "paid_at"
	if status == "paid" {
		paidAt = "now()"
	}

	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE invoices SET status = $3, paid_at = %s, updated_at = now()
		 WHERE id = $1 AND user_id = $2
		 RETURNING %s`, paidAt, invoiceColumns),
		id, userID, status,
	).Scan(&inv.ID, &inv.UserID, &inv.ClientID, &inv.InvoiceNumber, &inv.Status, &inv.IssueDate, &inv.DueDate, &inv.Subtotal, &inv.TaxRate, &inv.TaxAmount, &inv.Total, &inv.Currency, &inv.Notes, &lineItemsOut, &inv.PaidAt, &inv.CreatedAt, &inv.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(lineItemsOut, &inv.LineItems); err != nil {
		inv.LineItems = []models.InvoiceLineItem{}
	}
	return &inv, nil
}

func (r *InvoiceRepo) Delete(ctx context.Context, id, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM invoices WHERE id = $1 AND user_id = $2`,
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
