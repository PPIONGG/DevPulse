-- SQL Academy tables

CREATE TABLE IF NOT EXISTS sql_lessons (
    id TEXT PRIMARY KEY, -- Using slug-like IDs for lessons
    module_id TEXT NOT NULL,
    module_title TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    practice_query TEXT NOT NULL,
    expected_output_json TEXT, -- Store expected result for validation
    table_schema TEXT NOT NULL DEFAULT '', -- Custom schema per lesson
    seed_data TEXT NOT NULL DEFAULT '',     -- Custom seed data per lesson
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sql_lesson_progress (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL REFERENCES sql_lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_sql_lesson_progress_user ON sql_lesson_progress(user_id);

-- Migration to update sql_submissions with better safety
ALTER TABLE sql_submissions ADD COLUMN IF NOT EXISTS query_plan TEXT;

-- Seed initial lessons
INSERT INTO sql_lessons (id, module_id, module_title, title, description, content, practice_query, table_schema, seed_data, sort_order)
VALUES 
(
    'intro-to-sql', 
    'basics', 
    '1. The Basics of Data', 
    'What is SQL?', 
    'Learn what SQL is and why it''s the language of data.', 
    'SQL stands for **Structured Query Language**. It is used to communicate with databases. Think of a database like a giant Excel file with many sheets (we call these **Tables**).\n\nIn this lesson, you''ll learn your first command: `SELECT`.\n\n`SELECT` is used to pick which columns you want to see.\n`FROM` tells the database which table to look into.\n\n**Try it:** Select everything from the `users` table.',
    'SELECT * FROM users;',
    'CREATE TABLE users (id SERIAL PRIMARY KEY, username TEXT, display_name TEXT);',
    'INSERT INTO users (username, display_name) VALUES (''jdoe'', ''John Doe''), (''asmith'', ''Alice Smith'');',
    10
),
(
    'selecting-columns', 
    'basics', 
    '1. The Basics of Data', 
    'Selecting Specific Columns', 
    'How to pick only the data you need.', 
    'Using `*` gets every column, but usually, we only need a few. To do this, you list the column names separated by commas.\n\nExample: `SELECT name, email FROM users;`\n\n**Try it:** Select only the `username` and `display_name` from the `users` table.',
    'SELECT username, display_name FROM users;',
    'CREATE TABLE users (id SERIAL PRIMARY KEY, username TEXT, display_name TEXT);',
    'INSERT INTO users (username, display_name) VALUES (''jdoe'', ''John Doe''), (''asmith'', ''Alice Smith'');',
    20
),
(
    'where-clause', 
    'filtering', 
    '2. Filtering Data', 
    'The WHERE Clause', 
    'Filter rows based on specific conditions.', 
    'The `WHERE` clause allows you to filter rows. Only rows that meet the condition will be shown.\n\nExample: `SELECT * FROM products WHERE price > 100;` \n\n**Try it:** Select all products with a price greater than 50.',
    'SELECT * FROM products WHERE price > 50;',
    'CREATE TABLE products (id SERIAL PRIMARY KEY, name TEXT, price DECIMAL);',
    'INSERT INTO products (name, price) VALUES (''Laptop'', 1200), (''Mouse'', 25), (''Keyboard'', 75);',
    30
)
ON CONFLICT (id) DO NOTHING;
