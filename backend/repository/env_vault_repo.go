package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type EnvVaultRepo struct {
	pool *pgxpool.Pool
}

func NewEnvVaultRepo(pool *pgxpool.Pool) *EnvVaultRepo {
	return &EnvVaultRepo{pool: pool}
}

const vaultColumns = `id, user_id, name, environment, description, is_favorite, created_at, updated_at`
const variableColumns = `id, vault_id, key, value, is_secret, position, created_at`

func scanVault(scanner interface{ Scan(dest ...any) error }, v *models.EnvVault) error {
	return scanner.Scan(&v.ID, &v.UserID, &v.Name, &v.Environment, &v.Description, &v.IsFavorite, &v.CreatedAt, &v.UpdatedAt)
}

func scanVariable(scanner interface{ Scan(dest ...any) error }, v *models.EnvVariable) error {
	return scanner.Scan(&v.ID, &v.VaultID, &v.Key, &v.Value, &v.IsSecret, &v.Position, &v.CreatedAt)
}

func (r *EnvVaultRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]models.EnvVault, error) {
	// Fetch vaults
	vaultRows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT %s FROM env_vaults WHERE user_id = $1 ORDER BY updated_at DESC`, vaultColumns),
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer vaultRows.Close()

	var vaults []models.EnvVault
	vaultMap := make(map[uuid.UUID]int)
	for vaultRows.Next() {
		var v models.EnvVault
		if err := scanVault(vaultRows, &v); err != nil {
			return nil, err
		}
		v.Variables = []models.EnvVariable{}
		vaultMap[v.ID] = len(vaults)
		vaults = append(vaults, v)
	}
	if err := vaultRows.Err(); err != nil {
		return nil, err
	}

	if len(vaults) == 0 {
		return []models.EnvVault{}, nil
	}

	// Fetch all variables for this user's vaults
	varRows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT %s FROM env_variables WHERE vault_id IN (SELECT id FROM env_vaults WHERE user_id = $1) ORDER BY position ASC, created_at ASC`, variableColumns),
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer varRows.Close()

	for varRows.Next() {
		var v models.EnvVariable
		if err := scanVariable(varRows, &v); err != nil {
			return nil, err
		}
		if idx, ok := vaultMap[v.VaultID]; ok {
			vaults[idx].Variables = append(vaults[idx].Variables, v)
		}
	}
	if err := varRows.Err(); err != nil {
		return nil, err
	}

	return vaults, nil
}

func (r *EnvVaultRepo) GetByID(ctx context.Context, userID, vaultID uuid.UUID) (*models.EnvVault, error) {
	var v models.EnvVault
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT %s FROM env_vaults WHERE id = $1 AND user_id = $2`, vaultColumns),
		vaultID, userID,
	).Scan(&v.ID, &v.UserID, &v.Name, &v.Environment, &v.Description, &v.IsFavorite, &v.CreatedAt, &v.UpdatedAt)
	if err != nil {
		return nil, err
	}

	// Fetch variables
	varRows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT %s FROM env_variables WHERE vault_id = $1 ORDER BY position ASC, created_at ASC`, variableColumns),
		vaultID,
	)
	if err != nil {
		return nil, err
	}
	defer varRows.Close()

	v.Variables = []models.EnvVariable{}
	for varRows.Next() {
		var ev models.EnvVariable
		if err := scanVariable(varRows, &ev); err != nil {
			return nil, err
		}
		v.Variables = append(v.Variables, ev)
	}
	if err := varRows.Err(); err != nil {
		return nil, err
	}

	return &v, nil
}

func (r *EnvVaultRepo) Create(ctx context.Context, userID uuid.UUID, input models.EnvVaultInput) (*models.EnvVault, error) {
	var v models.EnvVault
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`INSERT INTO env_vaults (user_id, name, environment, description, is_favorite)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING %s`, vaultColumns),
		userID, input.Name, input.Environment, input.Description, input.IsFavorite,
	).Scan(&v.ID, &v.UserID, &v.Name, &v.Environment, &v.Description, &v.IsFavorite, &v.CreatedAt, &v.UpdatedAt)
	if err != nil {
		return nil, err
	}
	v.Variables = []models.EnvVariable{}
	return &v, nil
}

func (r *EnvVaultRepo) Update(ctx context.Context, userID, vaultID uuid.UUID, input models.EnvVaultInput) (*models.EnvVault, error) {
	var v models.EnvVault
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE env_vaults
		 SET name = $3, environment = $4, description = $5, is_favorite = $6, updated_at = now()
		 WHERE id = $1 AND user_id = $2
		 RETURNING %s`, vaultColumns),
		vaultID, userID, input.Name, input.Environment, input.Description, input.IsFavorite,
	).Scan(&v.ID, &v.UserID, &v.Name, &v.Environment, &v.Description, &v.IsFavorite, &v.CreatedAt, &v.UpdatedAt)
	if err != nil {
		return nil, err
	}

	// Re-fetch variables
	vault, err := r.GetByID(ctx, userID, vaultID)
	if err != nil {
		return nil, err
	}
	v.Variables = vault.Variables
	return &v, nil
}

func (r *EnvVaultRepo) Delete(ctx context.Context, userID, vaultID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM env_vaults WHERE id = $1 AND user_id = $2`,
		vaultID, userID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *EnvVaultRepo) AddVariable(ctx context.Context, userID, vaultID uuid.UUID, input models.EnvVariableInput) (*models.EnvVariable, error) {
	// Validate vault ownership
	var exists bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM env_vaults WHERE id = $1 AND user_id = $2)`, vaultID, userID).Scan(&exists)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrNotFound
	}

	// Get next position
	var maxPos int
	err = r.pool.QueryRow(ctx, `SELECT COALESCE(MAX(position), -1) + 1 FROM env_variables WHERE vault_id = $1`, vaultID).Scan(&maxPos)
	if err != nil {
		return nil, err
	}

	var v models.EnvVariable
	err = r.pool.QueryRow(ctx,
		fmt.Sprintf(`INSERT INTO env_variables (vault_id, key, value, is_secret, position)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING %s`, variableColumns),
		vaultID, input.Key, input.Value, input.IsSecret, maxPos,
	).Scan(&v.ID, &v.VaultID, &v.Key, &v.Value, &v.IsSecret, &v.Position, &v.CreatedAt)
	if err != nil {
		return nil, err
	}

	// Touch vault updated_at
	r.pool.Exec(ctx, `UPDATE env_vaults SET updated_at = now() WHERE id = $1`, vaultID)

	return &v, nil
}

func (r *EnvVaultRepo) UpdateVariable(ctx context.Context, userID, varID uuid.UUID, input models.EnvVariableInput) (*models.EnvVariable, error) {
	var v models.EnvVariable
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE env_variables
		 SET key = $3, value = $4, is_secret = $5
		 WHERE id = $1 AND vault_id IN (SELECT id FROM env_vaults WHERE user_id = $2)
		 RETURNING %s`, variableColumns),
		varID, userID, input.Key, input.Value, input.IsSecret,
	).Scan(&v.ID, &v.VaultID, &v.Key, &v.Value, &v.IsSecret, &v.Position, &v.CreatedAt)
	if err != nil {
		return nil, err
	}

	// Touch vault updated_at
	r.pool.Exec(ctx, `UPDATE env_vaults SET updated_at = now() WHERE id = $1`, v.VaultID)

	return &v, nil
}

func (r *EnvVaultRepo) DeleteVariable(ctx context.Context, userID, varID uuid.UUID) error {
	// Get vault_id before deleting for touch
	var vaultID uuid.UUID
	err := r.pool.QueryRow(ctx,
		`SELECT vault_id FROM env_variables WHERE id = $1 AND vault_id IN (SELECT id FROM env_vaults WHERE user_id = $2)`,
		varID, userID,
	).Scan(&vaultID)
	if err != nil {
		return ErrNotFound
	}

	tag, err := r.pool.Exec(ctx,
		`DELETE FROM env_variables WHERE id = $1 AND vault_id IN (SELECT id FROM env_vaults WHERE user_id = $2)`,
		varID, userID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}

	// Touch vault updated_at
	r.pool.Exec(ctx, `UPDATE env_vaults SET updated_at = now() WHERE id = $1`, vaultID)

	return nil
}

func (r *EnvVaultRepo) ImportVariables(ctx context.Context, userID, vaultID uuid.UUID, raw string) ([]models.EnvVariable, error) {
	// Validate vault ownership
	var exists bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM env_vaults WHERE id = $1 AND user_id = $2)`, vaultID, userID).Scan(&exists)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrNotFound
	}

	// Parse raw .env content
	parsed := parseEnvFile(raw)
	if len(parsed) == 0 {
		return []models.EnvVariable{}, nil
	}

	// Get current max position
	var maxPos int
	err = r.pool.QueryRow(ctx, `SELECT COALESCE(MAX(position), -1) + 1 FROM env_variables WHERE vault_id = $1`, vaultID).Scan(&maxPos)
	if err != nil {
		return nil, err
	}

	// Upsert variables
	var results []models.EnvVariable
	for i, v := range parsed {
		var ev models.EnvVariable
		err := r.pool.QueryRow(ctx,
			fmt.Sprintf(`INSERT INTO env_variables (vault_id, key, value, is_secret, position)
			 VALUES ($1, $2, $3, $4, $5)
			 ON CONFLICT (vault_id, key) DO UPDATE SET value = EXCLUDED.value, is_secret = EXCLUDED.is_secret
			 RETURNING %s`, variableColumns),
			vaultID, v.Key, v.Value, v.IsSecret, maxPos+i,
		).Scan(&ev.ID, &ev.VaultID, &ev.Key, &ev.Value, &ev.IsSecret, &ev.Position, &ev.CreatedAt)
		if err != nil {
			return nil, err
		}
		results = append(results, ev)
	}

	// Touch vault updated_at
	r.pool.Exec(ctx, `UPDATE env_vaults SET updated_at = now() WHERE id = $1`, vaultID)

	if results == nil {
		results = []models.EnvVariable{}
	}
	return results, nil
}

func parseEnvFile(raw string) []models.EnvVariableInput {
	var vars []models.EnvVariableInput
	for _, line := range strings.Split(raw, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		// Strip surrounding quotes
		value = strings.Trim(value, `"'`)
		vars = append(vars, models.EnvVariableInput{Key: key, Value: value, IsSecret: true})
	}
	return vars
}
