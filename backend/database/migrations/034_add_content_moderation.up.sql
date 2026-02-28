-- Add verification fields to snippets
ALTER TABLE snippets ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE snippets ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE snippets ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Index for public+verified queries
CREATE INDEX IF NOT EXISTS idx_snippets_public_verified ON snippets (is_public, is_verified);
