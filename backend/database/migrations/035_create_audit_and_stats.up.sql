-- Vault audit logs
CREATE TABLE IF NOT EXISTS vault_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id UUID NOT NULL REFERENCES env_vaults(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT NOT NULL DEFAULT '',
    ip_address TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vault_audit_vault_id ON vault_audit_logs (vault_id);
CREATE INDEX IF NOT EXISTS idx_vault_audit_user_id ON vault_audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_vault_audit_created_at ON vault_audit_logs (created_at DESC);
