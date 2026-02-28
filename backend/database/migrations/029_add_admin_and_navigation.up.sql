-- Add Role to Users and Create Navigation Settings table

-- 1. Update users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- 2. Create navigation_items table
CREATE TABLE IF NOT EXISTS navigation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    icon TEXT NOT NULL, -- Name of the Lucide icon
    path TEXT NOT NULL UNIQUE,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    min_role TEXT NOT NULL DEFAULT 'user', -- 'user' or 'admin'
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Seed initial navigation items based on current project modules
INSERT INTO navigation_items (label, icon, path, sort_order) VALUES
('Dashboard', 'LayoutDashboard', '/dashboard', 10),
('Code Snippets', 'Code2', '/code-snippets', 20),
('Expenses', 'DollarSign', '/expenses', 30),
('Habits', 'Target', '/habits', 40),
('Kanban', 'Kanban', '/kanban', 50),
('Pomodoro', 'Clock', '/pomodoro', 60),
('Env Vault', 'ShieldCheck', '/env-vault', 70),
('JSON Tools', 'Binary', '/json-tools', 80),
('API Playground', 'Zap', '/api-playground', 90),
('Time Tracker', 'History', '/time-tracker', 100),
('SQL Practice', 'Database', '/sql-practice', 110),
('Workflows', 'Workflow', '/workflows', 120),
('Marketplace', 'ShoppingBag', '/marketplace', 130),
('DB Explorer', 'SearchCode', '/db-explorer', 140),
('Calculator', 'Calculator', '/calculator', 150)
ON CONFLICT (path) DO NOTHING;

-- 4. Set first user as admin (optional, helper for development)
-- UPDATE users SET role = 'admin' WHERE id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1);
