package engine

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type ConnectionManager struct {
	conns      map[string]*pgxpool.Pool
	mu         sync.RWMutex
	encryptKey []byte
}

func NewConnectionManager(sessionSecret string) *ConnectionManager {
	hash := sha256.Sum256([]byte(sessionSecret))
	return &ConnectionManager{
		conns:      make(map[string]*pgxpool.Pool),
		encryptKey: hash[:],
	}
}

func (m *ConnectionManager) buildDSN(input models.DBConnectionInput) string {
	return fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=%s",
		input.Username, input.Password, input.Host, input.Port, input.DatabaseName, input.SSLMode,
	)
}

func (m *ConnectionManager) buildDSNFromConn(conn *models.DBConnection, password string) string {
	return fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=%s",
		conn.Username, password, conn.Host, conn.Port, conn.DatabaseName, conn.SSLMode,
	)
}

func (m *ConnectionManager) GetConnection(ctx context.Context, conn *models.DBConnection) (*pgxpool.Pool, error) {
	connKey := conn.ID.String()

	m.mu.RLock()
	if pool, ok := m.conns[connKey]; ok {
		m.mu.RUnlock()
		// Verify connection is still alive
		if err := pool.Ping(ctx); err == nil {
			return pool, nil
		}
		// Connection dead, remove and reconnect
		m.mu.Lock()
		pool.Close()
		delete(m.conns, connKey)
		m.mu.Unlock()
	} else {
		m.mu.RUnlock()
	}

	// Decrypt password
	password, err := m.Decrypt(conn.PasswordEncrypted)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt password: %w", err)
	}

	dsn := m.buildDSNFromConn(conn, password)

	connCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(connCtx, dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}

	if err := pool.Ping(connCtx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping: %w", err)
	}

	m.mu.Lock()
	m.conns[connKey] = pool
	m.mu.Unlock()

	return pool, nil
}

func (m *ConnectionManager) TestConnection(ctx context.Context, input models.DBConnectionInput) error {
	dsn := m.buildDSN(input)

	testCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(testCtx, dsn)
	if err != nil {
		return fmt.Errorf("connection failed: %w", err)
	}
	defer pool.Close()

	if err := pool.Ping(testCtx); err != nil {
		return fmt.Errorf("ping failed: %w", err)
	}
	return nil
}

func (m *ConnectionManager) CloseConnection(connID string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if pool, ok := m.conns[connID]; ok {
		pool.Close()
		delete(m.conns, connID)
	}
}

func (m *ConnectionManager) Encrypt(plaintext string) (string, error) {
	block, err := aes.NewCipher(m.encryptKey)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, aesGCM.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := aesGCM.Seal(nonce, nonce, []byte(plaintext), nil)
	return hex.EncodeToString(ciphertext), nil
}

func (m *ConnectionManager) Decrypt(encrypted string) (string, error) {
	if encrypted == "" {
		return "", nil
	}

	data, err := hex.DecodeString(encrypted)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(m.encryptKey)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := aesGCM.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := aesGCM.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

func (m *ConnectionManager) GetTables(ctx context.Context, pool *pgxpool.Pool) ([]models.TableInfo, error) {
	query := `
		SELECT
			t.table_name,
			t.table_schema,
			COALESCE(c.reltuples::bigint, 0) AS row_estimate,
			COALESCE(pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name)), 0) AS size_bytes
		FROM information_schema.tables t
		LEFT JOIN pg_class c ON c.relname = t.table_name
			AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = t.table_schema)
		WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema')
			AND t.table_type = 'BASE TABLE'
		ORDER BY t.table_schema, t.table_name`

	rows, err := pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tables []models.TableInfo
	for rows.Next() {
		var t models.TableInfo
		if err := rows.Scan(&t.Name, &t.Schema, &t.RowEstimate, &t.SizeBytes); err != nil {
			return nil, err
		}
		tables = append(tables, t)
	}
	if tables == nil {
		tables = []models.TableInfo{}
	}
	return tables, rows.Err()
}

func (m *ConnectionManager) GetTableColumns(ctx context.Context, pool *pgxpool.Pool, tableName string) ([]models.ColumnInfo, error) {
	query := `
		SELECT
			c.column_name,
			c.data_type,
			c.is_nullable = 'YES' AS is_nullable,
			COALESCE(
				EXISTS(
					SELECT 1 FROM information_schema.table_constraints tc
					JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
						AND tc.table_schema = kcu.table_schema
					WHERE tc.constraint_type = 'PRIMARY KEY'
						AND tc.table_name = c.table_name
						AND tc.table_schema = c.table_schema
						AND kcu.column_name = c.column_name
				), false
			) AS is_primary_key,
			c.column_default,
			c.ordinal_position
		FROM information_schema.columns c
		WHERE c.table_name = $1
			AND c.table_schema NOT IN ('pg_catalog', 'information_schema')
		ORDER BY c.ordinal_position`

	rows, err := pool.Query(ctx, query, tableName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var columns []models.ColumnInfo
	for rows.Next() {
		var col models.ColumnInfo
		if err := rows.Scan(&col.Name, &col.DataType, &col.IsNullable, &col.IsPrimaryKey, &col.DefaultValue, &col.OrdinalPos); err != nil {
			return nil, err
		}
		columns = append(columns, col)
	}
	if columns == nil {
		columns = []models.ColumnInfo{}
	}
	return columns, rows.Err()
}

func (m *ConnectionManager) GetForeignKeys(ctx context.Context, pool *pgxpool.Pool, tableName string) ([]models.ForeignKeyInfo, error) {
	query := `
		SELECT
			kcu.column_name,
			ccu.table_name AS foreign_table,
			ccu.column_name AS foreign_column,
			tc.constraint_name
		FROM information_schema.table_constraints tc
		JOIN information_schema.key_column_usage kcu
			ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
		JOIN information_schema.constraint_column_usage ccu
			ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
		WHERE tc.constraint_type = 'FOREIGN KEY'
			AND tc.table_name = $1
			AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
		ORDER BY kcu.column_name`

	rows, err := pool.Query(ctx, query, tableName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var fks []models.ForeignKeyInfo
	for rows.Next() {
		var fk models.ForeignKeyInfo
		if err := rows.Scan(&fk.ColumnName, &fk.ForeignTable, &fk.ForeignColumn, &fk.ConstraintName); err != nil {
			return nil, err
		}
		fks = append(fks, fk)
	}
	if fks == nil {
		fks = []models.ForeignKeyInfo{}
	}
	return fks, rows.Err()
}

func (m *ConnectionManager) ExecuteQuery(ctx context.Context, pool *pgxpool.Pool, query string, limit int, isReadOnly bool) (*models.QueryResult, error) {
	if limit <= 0 || limit > 1000 {
		limit = 100
	}

	// Enforce read-only mode
	if isReadOnly {
		trimmed := strings.TrimSpace(strings.ToUpper(query))
		if !strings.HasPrefix(trimmed, "SELECT") && !strings.HasPrefix(trimmed, "EXPLAIN") && !strings.HasPrefix(trimmed, "WITH") {
			return nil, fmt.Errorf("only SELECT, EXPLAIN, and WITH queries are allowed in read-only mode")
		}
	}

	// Add timeout for query execution
	queryCtx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()

	start := time.Now()

	rows, err := pool.Query(queryCtx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Get column names
	fieldDescs := rows.FieldDescriptions()
	columns := make([]string, len(fieldDescs))
	for i, fd := range fieldDescs {
		columns[i] = string(fd.Name)
	}

	// Collect rows
	var resultRows [][]interface{}
	truncated := false
	for rows.Next() {
		if len(resultRows) >= limit {
			truncated = true
			break
		}
		values, err := rows.Values()
		if err != nil {
			return nil, err
		}
		// Convert values to JSON-serializable types
		row := make([]interface{}, len(values))
		for i, v := range values {
			row[i] = formatValue(v)
		}
		resultRows = append(resultRows, row)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	elapsed := time.Since(start)

	if resultRows == nil {
		resultRows = [][]interface{}{}
	}

	return &models.QueryResult{
		Columns:         columns,
		Rows:            resultRows,
		RowCount:        len(resultRows),
		ExecutionTimeMs: int(elapsed.Milliseconds()),
		Truncated:       truncated,
	}, nil
}

func formatValue(v interface{}) interface{} {
	if v == nil {
		return nil
	}
	switch val := v.(type) {
	case time.Time:
		return val.Format(time.RFC3339)
	case []byte:
		return string(val)
	case [16]byte:
		// UUID type from pgx
		return fmt.Sprintf("%x-%x-%x-%x-%x", val[0:4], val[4:6], val[6:8], val[8:10], val[10:16])
	default:
		return val
	}
}
