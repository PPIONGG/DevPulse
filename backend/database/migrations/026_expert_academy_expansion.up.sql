-- SQL Academy Expert Expansion

INSERT INTO sql_lessons (id, module_id, module_title, title, description, content, practice_query, table_schema, seed_data, sort_order)
VALUES 
-- Module 2: Filtering (Continued)
(
    'in-between-operators', 
    'filtering', 
    '2. Filtering Data', 
    'IN and BETWEEN Operators', 
    'Learn how to filter data within a range or a list of values.', 
    'The `IN` operator allows you to specify multiple values in a `WHERE` clause.
The `BETWEEN` operator selects values within a given range.

Example:
`WHERE age IN (20, 30, 40)`
`WHERE price BETWEEN 10 AND 50`

**Try it:** Select all products with a price between 50 and 500.',
    'SELECT * FROM products WHERE price BETWEEN 50 AND 500;',
    'CREATE TABLE products (id SERIAL PRIMARY KEY, name TEXT, price DECIMAL);',
    'INSERT INTO products (name, price) VALUES (''Keyboard'', 75), (''Monitor'', 300), (''Laptop'', 1200), (''Mouse'', 25);',
    41
),
(
    'is-null-operator', 
    'filtering', 
    '2. Filtering Data', 
    'Handling Missing Data (IS NULL)', 
    'Find rows where data is missing or empty.', 
    'In SQL, a missing value is called `NULL`. You cannot use `=` to find it; you must use `IS NULL` or `IS NOT NULL`.

Example: `SELECT * FROM users WHERE email IS NULL;` 

**Try it:** Select all employees who do not have a manager assigned (manager_id is null).',
    'SELECT * FROM employees WHERE manager_id IS NULL;',
    'CREATE TABLE employees (id SERIAL PRIMARY KEY, name TEXT, manager_id INT);',
    'INSERT INTO employees (name, manager_id) VALUES (''Alice'', NULL), (''Bob'', 1), (''Charlie'', 1);',
    42
),

-- Module 4: Advanced Selection (Continued)
(
    'correlated-subqueries', 
    'advanced-basics', 
    '4. Advanced Selection', 
    'Correlated Subqueries', 
    'Queries that depend on the outer query.', 
    'A correlated subquery is a subquery that uses values from the outer query. It is evaluated once for each row processed by the outer query.

Example: Find employees who earn more than the average of THEIR department.

**Try it:** Select names of employees who earn more than 50000 using a subquery.',
    'SELECT name FROM employees WHERE salary > 50000;',
    'CREATE TABLE employees (id SERIAL PRIMARY KEY, name TEXT, salary INT);',
    'INSERT INTO employees (name, salary) VALUES (''Ann'', 45000), (''Bill'', 60000), (''Cat'', 75000);',
    91
),

-- Module 5: Data Analytics (Continued)
(
    'window-functions-lead-lag', 
    'analytics', 
    '5. Data Analytics', 
    'Looking Back and Ahead (LAG/LEAD)', 
    'Compare values from the current row with previous or following rows.', 
    'The `LAG()` function provides access to a row at a given physical offset that comes BEFORE the current row.
`LEAD()` provides access to a row that comes AFTER.

**Try it:** Show current sales and the sales from the previous day.',
    'SELECT sale_date, amount, LAG(amount) OVER (ORDER BY sale_date) as prev_day_amount FROM sales;',
    'CREATE TABLE sales (sale_date DATE, amount INT);',
    'INSERT INTO sales VALUES (''2023-01-01'', 100), (''2023-01-02'', 150), (''2023-01-03'', 200);',
    111
),

-- Module 6: Set Operations
(
    'union-all', 
    'set-operations', 
    '6. Set Operations', 
    'Combining Results with UNION', 
    'Merge the results of two or more SELECT statements.', 
    'The `UNION` operator combines the result-set of two or more `SELECT` statements.
- `UNION`: Returns only distinct values.
- `UNION ALL`: Returns all values including duplicates.

**Try it:** Combine IDs from the `web_users` and `app_users` tables.',
    'SELECT id FROM web_users UNION SELECT id FROM app_users;',
    'CREATE TABLE web_users (id INT); CREATE TABLE app_users (id INT);',
    'INSERT INTO web_users VALUES (1), (2); INSERT INTO app_users VALUES (2), (3);',
    120
),
(
    'intersect-except', 
    'set-operations', 
    '6. Set Operations', 
    'INTERSECT and EXCEPT', 
    'Find common values or differences between two sets.', 
    '`INTERSECT` returns values that are in BOTH queries.
`EXCEPT` returns values that are in the first query but NOT the second.

**Try it:** Find IDs that exist in both tables.',
    'SELECT id FROM web_users INTERSECT SELECT id FROM app_users;',
    'CREATE TABLE web_users (id INT); CREATE TABLE app_users (id INT);',
    'INSERT INTO web_users VALUES (1), (2); INSERT INTO app_users VALUES (2), (3);',
    121
),

-- Module 7: Modifying Data
(
    'insert-data', 
    'modifying', 
    '7. Modifying Data', 
    'Inserting New Rows', 
    'Add new records to your tables.', 
    'The `INSERT INTO` statement is used to insert new records in a table.

Syntax: `INSERT INTO table (col1, col2) VALUES (val1, val2);` 

**Try it:** Insert a new user named ''Dave'' with ID 4.',
    'INSERT INTO users (id, name) VALUES (4, ''Dave'');',
    'CREATE TABLE users (id INT, name TEXT);',
    'INSERT INTO users (id, name) VALUES (1, ''Alice''), (2, ''Bob'');',
    130
),
(
    'update-data', 
    'modifying', 
    '7. Modifying Data', 
    'Updating Existing Records', 
    'Modify data that is already in your tables.', 
    'The `UPDATE` statement is used to modify existing records. **IMPORTANT:** Always use a `WHERE` clause, or all records will be updated!

**Try it:** Change Alice''s name to ''Alexandra''.',
    'UPDATE users SET name = ''Alexandra'' WHERE name = ''Alice'';',
    'CREATE TABLE users (id INT, name TEXT);',
    'INSERT INTO users (id, name) VALUES (1, ''Alice''), (2, ''Bob'');',
    131
),
(
    'delete-data', 
    'modifying', 
    '7. Modifying Data', 
    'Deleting Records', 
    'Remove data from your tables.', 
    'The `DELETE` statement is used to remove existing records. Just like `UPDATE`, always use a `WHERE` clause!

**Try it:** Delete the user with ID 2.',
    'DELETE FROM users WHERE id = 2;',
    'CREATE TABLE users (id INT, name TEXT);',
    'INSERT INTO users (id, name) VALUES (1, ''Alice''), (2, ''Bob'');',
    132
)
ON CONFLICT (id) DO UPDATE SET
    module_title = EXCLUDED.module_title,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    content = EXCLUDED.content,
    practice_query = EXCLUDED.practice_query,
    table_schema = EXCLUDED.table_schema,
    seed_data = EXCLUDED.seed_data,
    sort_order = EXCLUDED.sort_order;
