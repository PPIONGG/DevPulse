package handlers

import (
	"bytes"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/go-pdf/fpdf"
	"github.com/google/uuid"
	"github.com/thammasornlueadtaharn/devpulse-backend/helpers"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
	"github.com/thammasornlueadtaharn/devpulse-backend/repository"
)

type TimeTrackerHandler struct {
	clientRepo    *repository.ClientRepo
	projectRepo   *repository.ProjectRepo
	timeEntryRepo *repository.TimeEntryRepo
	invoiceRepo   *repository.InvoiceRepo
}

func NewTimeTrackerHandler(
	clientRepo *repository.ClientRepo,
	projectRepo *repository.ProjectRepo,
	timeEntryRepo *repository.TimeEntryRepo,
	invoiceRepo *repository.InvoiceRepo,
) *TimeTrackerHandler {
	return &TimeTrackerHandler{
		clientRepo:    clientRepo,
		projectRepo:   projectRepo,
		timeEntryRepo: timeEntryRepo,
		invoiceRepo:   invoiceRepo,
	}
}

// ─── Clients ───

func (h *TimeTrackerHandler) ListClients(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	clients, err := h.clientRepo.List(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch clients")
		return
	}
	helpers.JSON(w, http.StatusOK, clients)
}

func (h *TimeTrackerHandler) CreateClient(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var input models.ClientInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Name == "" {
		helpers.Error(w, http.StatusBadRequest, "name is required")
		return
	}
	if input.Currency == "" {
		input.Currency = "USD"
	}
	client, err := h.clientRepo.Create(r.Context(), userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to create client")
		return
	}
	helpers.JSON(w, http.StatusCreated, client)
}

func (h *TimeTrackerHandler) UpdateClient(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid client ID")
		return
	}
	var input models.ClientInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Name == "" {
		helpers.Error(w, http.StatusBadRequest, "name is required")
		return
	}
	if input.Currency == "" {
		input.Currency = "USD"
	}
	client, err := h.clientRepo.Update(r.Context(), id, userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update client")
		return
	}
	helpers.JSON(w, http.StatusOK, client)
}

func (h *TimeTrackerHandler) DeleteClient(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid client ID")
		return
	}
	if err := h.clientRepo.Delete(r.Context(), id, userID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "client not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete client")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

// ─── Projects ───

func (h *TimeTrackerHandler) ListProjects(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	all := r.URL.Query().Get("all")
	var projects []models.Project
	var err error
	if all == "true" {
		projects, err = h.projectRepo.ListAll(r.Context(), userID)
	} else {
		projects, err = h.projectRepo.List(r.Context(), userID)
	}
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch projects")
		return
	}
	helpers.JSON(w, http.StatusOK, projects)
}

func (h *TimeTrackerHandler) CreateProject(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var input models.ProjectInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" {
		helpers.Error(w, http.StatusBadRequest, "title is required")
		return
	}
	if input.Color == "" {
		input.Color = "#6b7280"
	}
	project, err := h.projectRepo.Create(r.Context(), userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to create project")
		return
	}
	helpers.JSON(w, http.StatusCreated, project)
}

func (h *TimeTrackerHandler) UpdateProject(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid project ID")
		return
	}
	var input models.ProjectInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Title == "" {
		helpers.Error(w, http.StatusBadRequest, "title is required")
		return
	}
	if input.Color == "" {
		input.Color = "#6b7280"
	}
	project, err := h.projectRepo.Update(r.Context(), id, userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update project")
		return
	}
	helpers.JSON(w, http.StatusOK, project)
}

func (h *TimeTrackerHandler) ArchiveProject(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid project ID")
		return
	}
	if err := h.projectRepo.Archive(r.Context(), id, userID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "project not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to archive project")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "toggled"})
}

func (h *TimeTrackerHandler) DeleteProject(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid project ID")
		return
	}
	if err := h.projectRepo.Delete(r.Context(), id, userID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "project not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete project")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

// ─── Time Entries ───

func (h *TimeTrackerHandler) ListEntries(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	q := r.URL.Query()

	var projectID *uuid.UUID
	if pid := q.Get("project_id"); pid != "" {
		parsed, err := uuid.Parse(pid)
		if err != nil {
			helpers.Error(w, http.StatusBadRequest, "invalid project_id")
			return
		}
		projectID = &parsed
	}

	entries, err := h.timeEntryRepo.List(r.Context(), userID, projectID, q.Get("from"), q.Get("to"))
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch time entries")
		return
	}
	helpers.JSON(w, http.StatusOK, entries)
}

func (h *TimeTrackerHandler) GetRunning(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	entry, err := h.timeEntryRepo.GetRunning(r.Context(), userID)
	if err != nil {
		helpers.JSON(w, http.StatusOK, nil)
		return
	}
	helpers.JSON(w, http.StatusOK, entry)
}

func (h *TimeTrackerHandler) StartTimer(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())

	var body struct {
		ProjectID   uuid.UUID `json:"project_id"`
		Description string    `json:"description"`
	}
	if err := helpers.DecodeJSON(r, &body); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if body.ProjectID == uuid.Nil {
		helpers.Error(w, http.StatusBadRequest, "project_id is required")
		return
	}

	// Check if there's already a running timer
	existing, _ := h.timeEntryRepo.GetRunning(r.Context(), userID)
	if existing != nil {
		helpers.Error(w, http.StatusConflict, "a timer is already running")
		return
	}

	input := models.TimeEntryInput{
		ProjectID:   body.ProjectID,
		Description: body.Description,
		StartTime:   time.Now(),
		IsBillable:  true,
		Tags:        []string{},
	}

	entry, err := h.timeEntryRepo.Create(r.Context(), userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to start timer")
		return
	}
	helpers.JSON(w, http.StatusCreated, entry)
}

func (h *TimeTrackerHandler) StopTimer(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid entry ID")
		return
	}

	entry, err := h.timeEntryRepo.Stop(r.Context(), id, userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to stop timer")
		return
	}
	helpers.JSON(w, http.StatusOK, entry)
}

func (h *TimeTrackerHandler) CreateEntry(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var input models.TimeEntryInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.ProjectID == uuid.Nil {
		helpers.Error(w, http.StatusBadRequest, "project_id is required")
		return
	}
	if input.StartTime.IsZero() {
		helpers.Error(w, http.StatusBadRequest, "start_time is required")
		return
	}

	entry, err := h.timeEntryRepo.Create(r.Context(), userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to create time entry")
		return
	}
	helpers.JSON(w, http.StatusCreated, entry)
}

func (h *TimeTrackerHandler) UpdateEntry(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid entry ID")
		return
	}
	var input models.TimeEntryInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	entry, err := h.timeEntryRepo.Update(r.Context(), id, userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update time entry")
		return
	}
	helpers.JSON(w, http.StatusOK, entry)
}

func (h *TimeTrackerHandler) DeleteEntry(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid entry ID")
		return
	}
	if err := h.timeEntryRepo.Delete(r.Context(), id, userID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "time entry not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete time entry")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

// ─── Reports ───

func (h *TimeTrackerHandler) GetReport(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	from := r.URL.Query().Get("from")
	to := r.URL.Query().Get("to")
	if from == "" || to == "" {
		helpers.Error(w, http.StatusBadRequest, "from and to query params are required")
		return
	}

	report, err := h.timeEntryRepo.GetReport(r.Context(), userID, from, to)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to generate report")
		return
	}
	helpers.JSON(w, http.StatusOK, report)
}

// ─── Invoices ───

func (h *TimeTrackerHandler) ListInvoices(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	invoices, err := h.invoiceRepo.List(r.Context(), userID)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to fetch invoices")
		return
	}
	helpers.JSON(w, http.StatusOK, invoices)
}

func (h *TimeTrackerHandler) GetInvoice(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid invoice ID")
		return
	}
	invoice, err := h.invoiceRepo.GetByID(r.Context(), id, userID)
	if err != nil {
		helpers.Error(w, http.StatusNotFound, "invoice not found")
		return
	}
	helpers.JSON(w, http.StatusOK, invoice)
}

func (h *TimeTrackerHandler) CreateInvoice(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	var input models.InvoiceInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.DueDate == "" {
		helpers.Error(w, http.StatusBadRequest, "due_date is required")
		return
	}
	if input.Currency == "" {
		input.Currency = "USD"
	}

	invoice, err := h.invoiceRepo.Create(r.Context(), userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to create invoice")
		return
	}
	helpers.JSON(w, http.StatusCreated, invoice)
}

func (h *TimeTrackerHandler) UpdateInvoice(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid invoice ID")
		return
	}
	var input models.InvoiceInput
	if err := helpers.DecodeJSON(r, &input); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Currency == "" {
		input.Currency = "USD"
	}

	invoice, err := h.invoiceRepo.Update(r.Context(), id, userID, input)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update invoice")
		return
	}
	helpers.JSON(w, http.StatusOK, invoice)
}

func (h *TimeTrackerHandler) UpdateInvoiceStatus(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid invoice ID")
		return
	}

	var body struct {
		Status string `json:"status"`
	}
	if err := helpers.DecodeJSON(r, &body); err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	validStatuses := map[string]bool{"draft": true, "sent": true, "paid": true, "overdue": true, "cancelled": true}
	if !validStatuses[body.Status] {
		helpers.Error(w, http.StatusBadRequest, "invalid status")
		return
	}

	invoice, err := h.invoiceRepo.UpdateStatus(r.Context(), id, userID, body.Status)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to update invoice status")
		return
	}
	helpers.JSON(w, http.StatusOK, invoice)
}

func (h *TimeTrackerHandler) DeleteInvoice(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid invoice ID")
		return
	}
	if err := h.invoiceRepo.Delete(r.Context(), id, userID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			helpers.Error(w, http.StatusNotFound, "invoice not found")
			return
		}
		helpers.Error(w, http.StatusInternalServerError, "failed to delete invoice")
		return
	}
	helpers.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

func (h *TimeTrackerHandler) DownloadPDF(w http.ResponseWriter, r *http.Request) {
	userID := helpers.UserIDFromContext(r.Context())
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		helpers.Error(w, http.StatusBadRequest, "invalid invoice ID")
		return
	}

	invoice, err := h.invoiceRepo.GetByID(r.Context(), id, userID)
	if err != nil {
		helpers.Error(w, http.StatusNotFound, "invoice not found")
		return
	}

	// Fetch client name if available
	clientName := ""
	if invoice.ClientID != nil {
		clients, _ := h.clientRepo.List(r.Context(), userID)
		for _, c := range clients {
			if c.ID == *invoice.ClientID {
				clientName = c.Name
				break
			}
		}
	}

	pdfBytes, err := generateInvoicePDF(invoice, clientName)
	if err != nil {
		helpers.Error(w, http.StatusInternalServerError, "failed to generate PDF")
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s.pdf"`, invoice.InvoiceNumber))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(pdfBytes)))
	w.Write(pdfBytes)
}

func generateInvoicePDF(invoice *models.Invoice, clientName string) ([]byte, error) {
	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 20)
	pdf.AddPage()

	// Header
	pdf.SetFont("Helvetica", "B", 24)
	pdf.Cell(0, 12, "INVOICE")
	pdf.Ln(16)

	// Invoice details
	pdf.SetFont("Helvetica", "", 10)
	pdf.Cell(95, 6, fmt.Sprintf("Invoice #: %s", invoice.InvoiceNumber))
	pdf.Cell(95, 6, fmt.Sprintf("Status: %s", invoice.Status))
	pdf.Ln(6)
	pdf.Cell(95, 6, fmt.Sprintf("Issue Date: %s", invoice.IssueDate))
	pdf.Cell(95, 6, fmt.Sprintf("Due Date: %s", invoice.DueDate))
	pdf.Ln(6)
	if clientName != "" {
		pdf.Cell(95, 6, fmt.Sprintf("Client: %s", clientName))
		pdf.Ln(6)
	}
	pdf.Cell(95, 6, fmt.Sprintf("Currency: %s", invoice.Currency))
	pdf.Ln(12)

	// Line items table header
	pdf.SetFont("Helvetica", "B", 9)
	pdf.SetFillColor(240, 240, 240)
	pdf.CellFormat(80, 8, "Description", "1", 0, "L", true, 0, "")
	pdf.CellFormat(30, 8, "Hours", "1", 0, "R", true, 0, "")
	pdf.CellFormat(35, 8, "Rate", "1", 0, "R", true, 0, "")
	pdf.CellFormat(40, 8, "Amount", "1", 0, "R", true, 0, "")
	pdf.Ln(8)

	// Line items
	pdf.SetFont("Helvetica", "", 9)
	for _, item := range invoice.LineItems {
		pdf.CellFormat(80, 7, item.Description, "1", 0, "L", false, 0, "")
		pdf.CellFormat(30, 7, fmt.Sprintf("%.2f", item.Hours), "1", 0, "R", false, 0, "")
		pdf.CellFormat(35, 7, fmt.Sprintf("%.2f", item.Rate), "1", 0, "R", false, 0, "")
		pdf.CellFormat(40, 7, fmt.Sprintf("%.2f", item.Amount), "1", 0, "R", false, 0, "")
		pdf.Ln(7)
	}

	pdf.Ln(4)

	// Totals
	pdf.SetFont("Helvetica", "", 10)
	pdf.Cell(145, 7, "Subtotal:")
	pdf.Cell(40, 7, fmt.Sprintf("%.2f %s", invoice.Subtotal, invoice.Currency))
	pdf.Ln(7)
	if invoice.TaxRate > 0 {
		pdf.Cell(145, 7, fmt.Sprintf("Tax (%.1f%%):", invoice.TaxRate))
		pdf.Cell(40, 7, fmt.Sprintf("%.2f %s", invoice.TaxAmount, invoice.Currency))
		pdf.Ln(7)
	}
	pdf.SetFont("Helvetica", "B", 11)
	pdf.Cell(145, 8, "Total:")
	pdf.Cell(40, 8, fmt.Sprintf("%.2f %s", invoice.Total, invoice.Currency))
	pdf.Ln(12)

	// Notes
	if invoice.Notes != "" {
		pdf.SetFont("Helvetica", "B", 10)
		pdf.Cell(0, 6, "Notes:")
		pdf.Ln(7)
		pdf.SetFont("Helvetica", "", 9)
		pdf.MultiCell(0, 5, invoice.Notes, "", "L", false)
	}

	// Footer
	pdf.Ln(10)
	pdf.SetFont("Helvetica", "I", 8)
	pdf.SetTextColor(128, 128, 128)
	pdf.Cell(0, 5, fmt.Sprintf("Generated on %s", time.Now().Format("2006-01-02")))

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
