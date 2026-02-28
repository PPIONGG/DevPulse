-- Add group_name column to navigation_items
ALTER TABLE navigation_items ADD COLUMN IF NOT EXISTS group_name TEXT NOT NULL DEFAULT 'Ungrouped';

-- Assign groups to existing navigation items
UPDATE navigation_items SET group_name = 'Overview' WHERE path = '/dashboard';
UPDATE navigation_items SET group_name = 'Development' WHERE path IN ('/code-snippets', '/json-tools', '/api-playground', '/sql-practice', '/db-explorer', '/calculator');
UPDATE navigation_items SET group_name = 'Projects' WHERE path IN ('/kanban', '/time-tracker', '/workflows', '/marketplace');
UPDATE navigation_items SET group_name = 'Lifestyle' WHERE path IN ('/expenses', '/habits', '/pomodoro');
UPDATE navigation_items SET group_name = 'System' WHERE path IN ('/env-vault', '/settings');
