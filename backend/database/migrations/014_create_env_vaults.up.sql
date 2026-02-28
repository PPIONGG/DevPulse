CREATE TABLE IF NOT EXISTS env_vaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    environment TEXT NOT NULL DEFAULT 'development',
    description TEXT NOT NULL DEFAULT '',
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS env_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id UUID NOT NULL REFERENCES env_vaults(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL DEFAULT '',
    is_secret BOOLEAN NOT NULL DEFAULT true,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_env_vaults_user_id ON env_vaults(user_id);
CREATE INDEX IF NOT EXISTS idx_env_variables_vault_id ON env_variables(vault_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_env_variables_unique_key ON env_variables(vault_id, key);
