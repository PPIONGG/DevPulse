-- Seed more SQL Academy lessons
INSERT INTO sql_lessons (id, module_id, module_title, title, description, content, practice_query, table_schema, seed_data, sort_order)
VALUES 
(
    'logical-operators', 
    'filtering', 
    '2. Filtering Data', 
    'AND, OR, and NOT', 
    'Combine multiple conditions to find exactly what you need.', 
    'Sometimes one condition isn''t enough. We use logical operators to combine them:

- `AND`: Both conditions must be true.
- `OR`: At least one condition must be true.
- `NOT`: The condition must be false.

Example: `SELECT * FROM products WHERE price > 50 AND price < 100;` 

**Try it:** Select products that are either named ''Mouse'' OR have a price greater than 1000.',
    'SELECT * FROM products WHERE name = ''Mouse'' OR price > 1000;',
    'CREATE TABLE products (id SERIAL PRIMARY KEY, name TEXT, price DECIMAL);',
    'INSERT INTO products (name, price) VALUES (''Laptop'', 1200), (''Mouse'', 25), (''Keyboard'', 75), (''Monitor'', 300);',
    40
),
(
    'pattern-matching', 
    'filtering', 
    '2. Filtering Data', 
    'Pattern Matching with LIKE', 
    'Find data that matches a specific pattern.', 
    'The `LIKE` operator is used in a `WHERE` clause to search for a specified pattern in a column. 

- `%` represents zero, one, or multiple characters.
- `_` represents a single character.

Example: `WHERE name LIKE ''A%''` finds any values that start with "A".

**Try it:** Find all products that have the word ''board'' anywhere in their name.',
    'SELECT * FROM products WHERE name LIKE ''%board%'';',
    'CREATE TABLE products (id SERIAL PRIMARY KEY, name TEXT, price DECIMAL);',
    'INSERT INTO products (name, price) VALUES (''Laptop'', 1200), (''Mouse'', 25), (''Keyboard'', 75), (''Mainboard'', 150);',
    50
),
(
    'aggregate-functions', 
    'summarizing', 
    '3. Summarizing Data', 
    'Aggregate Functions (COUNT, SUM, AVG)', 
    'Calculate totals, averages, and counts.', 
    'Aggregate functions perform a calculation on a set of values and return a single value:

- `COUNT()`: Returns the number of rows.
- `SUM()`: Returns the total sum of a numeric column.
- `AVG()`: Returns the average value.
- `MAX()` / `MIN()`: Returns the largest/smallest value.

**Try it:** Calculate the average price of all products.',
    'SELECT AVG(price) FROM products;',
    'CREATE TABLE products (id SERIAL PRIMARY KEY, name TEXT, price DECIMAL);',
    'INSERT INTO products (name, price) VALUES (''Laptop'', 1200), (''Mouse'', 25), (''Keyboard'', 75);',
    60
),
(
    'group-by', 
    'summarizing', 
    '3. Summarizing Data', 
    'Grouping with GROUP BY', 
    'Group rows that have the same values into summary rows.', 
    'The `GROUP BY` statement groups rows that have the same values into summary rows, like "find the number of products in each category". It is often used with aggregate functions.

Example: `SELECT category, COUNT(*) FROM products GROUP BY category;` 

**Try it:** Group by category and show the total price (`SUM`) for each category.',
    'SELECT category, SUM(price) FROM products GROUP BY category;',
    'CREATE TABLE products (id SERIAL PRIMARY KEY, name TEXT, price DECIMAL, category TEXT);',
    'INSERT INTO products (name, price, category) VALUES (''Laptop'', 1200, ''Electronics''), (''Mouse'', 25, ''Accessories''), (''Keyboard'', 75, ''Accessories''), (''Smartphone'', 800, ''Electronics'');',
    70
),
(
    'left-join', 
    'joins', 
    '3. Combining Tables', 
    'LEFT JOIN Explained', 
    'Include rows even if there is no match in the second table.', 
    'Unlike `INNER JOIN`, a `LEFT JOIN` returns all records from the left table, and the matched records from the right table. If there is no match, the result is `NULL` on the right side.

**Try it:** Select all departments and the names of employees in them. Use a `LEFT JOIN` to make sure departments with no employees still show up.',
    'SELECT departments.name, employees.name FROM departments LEFT JOIN employees ON departments.id = employees.dept_id;',
    'CREATE TABLE departments (id SERIAL PRIMARY KEY, name TEXT);
CREATE TABLE employees (id SERIAL PRIMARY KEY, name TEXT, dept_id INT);',
    'INSERT INTO departments (name) VALUES (''Sales''), (''Engineering''), (''Marketing'');
INSERT INTO employees (name, dept_id) VALUES (''Alice'', 1), (''Bob'', 2);',
    80
)
ON CONFLICT (id) DO UPDATE SET
    module_id = EXCLUDED.module_id,
    module_title = EXCLUDED.module_title,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    content = EXCLUDED.content,
    practice_query = EXCLUDED.practice_query,
    table_schema = EXCLUDED.table_schema,
    seed_data = EXCLUDED.seed_data,
    sort_order = EXCLUDED.sort_order;
