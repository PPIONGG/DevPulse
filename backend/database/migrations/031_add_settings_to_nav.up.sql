-- Add Settings to navigation items
INSERT INTO navigation_items (label, icon, path, sort_order) 
VALUES ('Settings', 'Settings', '/settings', 160)
ON CONFLICT (path) DO NOTHING;
