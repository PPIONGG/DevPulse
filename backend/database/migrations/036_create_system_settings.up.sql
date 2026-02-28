-- System settings key-value store
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Seed default settings
INSERT INTO system_settings (key, value) VALUES
    ('maintenance_mode', 'false'),
    ('maintenance_message', 'DevPulse is currently undergoing maintenance. Please check back shortly.'),
    ('announcement_enabled', 'false'),
    ('announcement_message', ''),
    ('announcement_type', 'info')
ON CONFLICT (key) DO NOTHING;

-- Feature toggles
CREATE TABLE IF NOT EXISTS feature_toggles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_path TEXT NOT NULL UNIQUE,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    disabled_message TEXT NOT NULL DEFAULT 'This feature is currently disabled.',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Seed toggles from existing navigation items
INSERT INTO feature_toggles (module_path, is_enabled)
SELECT path, true FROM navigation_items
ON CONFLICT (module_path) DO NOTHING;
