-- Mega Seed for SQL Academy & Challenges

-- 1. Add more Academy Lessons (Subqueries, CTEs, Window Functions)
INSERT INTO sql_lessons (id, module_id, module_title, title, description, content, practice_query, table_schema, seed_data, sort_order)
VALUES 
(
    'subqueries-intro', 
    'advanced-basics', 
    '4. Advanced Selection', 
    'Introduction to Subqueries', 
    'Learn how to use a query inside another query.', 
    'A subquery is a query nested inside another query. It is often used in the `WHERE` clause to filter data based on the results of another search.

Example: `SELECT * FROM emp WHERE salary > (SELECT AVG(salary) FROM emp);` 

**Try it:** Select all products whose price is greater than the average price of all products.',
    'SELECT * FROM products WHERE price > (SELECT AVG(price) FROM products);',
    'CREATE TABLE products (id SERIAL PRIMARY KEY, name TEXT, price DECIMAL);',
    'INSERT INTO products (name, price) VALUES (''Laptop'', 1200), (''Mouse'', 25), (''Keyboard'', 75), (''Monitor'', 300);',
    90
),
(
    'ctes-with', 
    'advanced-basics', 
    '4. Advanced Selection', 
    'Common Table Expressions (WITH)', 
    'Make complex queries readable using the WITH clause.', 
    'CTEs (Common Table Expressions) allow you to name a temporary result set which you can then reference within your main query. It makes long, complex queries much easier to read and maintain.

Example:
`WITH high_earners AS (`
  `SELECT * FROM employees WHERE salary > 5000`
`)
SELECT * FROM high_earners;` 

**Try it:** Create a CTE named `electronics` that selects all products from that category, then select everything from that CTE.',
    'WITH electronics AS (SELECT * FROM products WHERE category = ''Electronics'') SELECT * FROM electronics;',
    'CREATE TABLE products (id SERIAL PRIMARY KEY, name TEXT, price DECIMAL, category TEXT);',
    'INSERT INTO products (name, price, category) VALUES (''Laptop'', 1200, ''Electronics''), (''Mouse'', 25, ''Accessories''), (''Smartphone'', 800, ''Electronics'');',
    100
),
(
    'window-functions-rank', 
    'analytics', 
    '5. Data Analytics', 
    'Ranking with Window Functions', 
    'Rank your data without grouping it.', 
    'Window functions perform calculations across a set of rows related to the current row. Unlike `GROUP BY`, they don''t collapse rows into a single output row.

`RANK()` assigns a rank to each row within a partition.

**Try it:** Rank products by their price in descending order.',
    'SELECT name, price, RANK() OVER (ORDER BY price DESC) as price_rank FROM products;',
    'CREATE TABLE products (id SERIAL PRIMARY KEY, name TEXT, price DECIMAL);',
    'INSERT INTO products (name, price) VALUES (''Laptop'', 1200), (''Mouse'', 25), (''Keyboard'', 75), (''Monitor'', 300);',
    110
)
ON CONFLICT (id) DO UPDATE SET
    content = EXCLUDED.content,
    practice_query = EXCLUDED.practice_query,
    table_schema = EXCLUDED.table_schema,
    seed_data = EXCLUDED.seed_data;

-- 2. Add 15+ New Challenges (Medium to Hard)
INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES
(
    'monthly-sales-growth',
    'Monthly Sales Growth',
    'hard',
    'window',
    'Calculate the month-over-month growth percentage for sales. Show the month, current month sales, and the growth % compared to the previous month.',
    'CREATE TABLE sales (id SERIAL PRIMARY KEY, sale_date DATE, amount DECIMAL);',
    'INSERT INTO sales (sale_date, amount) VALUES (''2023-01-10'', 1000), (''2023-01-15'', 500), (''2023-02-05'', 2000), (''2023-02-20'', 1000), (''2023-03-12'', 4500);',
    'WITH monthly AS (SELECT DATE_TRUNC(''month'', sale_date) as month, SUM(amount) as sales FROM sales GROUP BY 1) SELECT month, sales, (sales - LAG(sales) OVER (ORDER BY month)) / LAG(sales) OVER (ORDER BY month) * 100 as growth FROM monthly;',
    'Use DATE_TRUNC to group by month, then use LAG() window function.',
    true,
    36
),
(
    'top-3-salaries-per-dept',
    'Top 3 Salaries per Department',
    'medium',
    'window',
    'Find the top 3 highest-paid employees in each department. If there are ties, they should all be included.',
    'CREATE TABLE employees (id SERIAL PRIMARY KEY, name TEXT, salary INT, dept_id INT);
CREATE TABLE depts (id SERIAL PRIMARY KEY, name TEXT);',
    'INSERT INTO depts (name) VALUES (''IT''), (''Sales'');
INSERT INTO employees (name, salary, dept_id) VALUES (''Joe'', 85000, 1), (''Max'', 90000, 1), (''Janet'', 69000, 1), (''Randy'', 85000, 1), (''Will'', 70000, 1), (''Alice'', 80000, 2);',
    'WITH ranked AS (SELECT e.name, e.salary, d.name as dept, DENSE_RANK() OVER (PARTITION BY d.name ORDER BY salary DESC) as rank FROM employees e JOIN depts d ON e.dept_id = d.id) SELECT name, salary, dept FROM ranked WHERE rank <= 3;',
    'Use DENSE_RANK() partitioned by department.',
    false,
    37
),
(
    'duplicate-emails',
    'Finding Duplicate Emails',
    'easy',
    'filtering',
    'Write a query to find all duplicate emails in the users table.',
    'CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT);',
    'INSERT INTO users (email) VALUES (''a@b.com''), (''c@d.com''), (''a@b.com''), (''e@f.com'');',
    'SELECT email FROM users GROUP BY email HAVING COUNT(email) > 1;',
    'Group by email and use HAVING.',
    false,
    38
),
(
    'active-users-count',
    'Daily Active Users',
    'medium',
    'aggregate',
    'Count the number of unique users who performed at least one action each day.',
    'CREATE TABLE actions (id SERIAL PRIMARY KEY, user_id INT, action_date DATE);',
    'INSERT INTO actions (user_id, action_date) VALUES (1, ''2023-05-01''), (1, ''2023-05-01''), (2, ''2023-05-01''), (1, ''2023-05-02''), (3, ''2023-05-02'');',
    'SELECT action_date, COUNT(DISTINCT user_id) FROM actions GROUP BY action_date;',
    'Use COUNT(DISTINCT user_id).',
    true,
    39
),
(
    'unpurchased-products',
    'Products Never Sold',
    'easy',
    'joins',
    'List the names of products that have never been sold (do not appear in the orders table).',
    'CREATE TABLE products (id SERIAL PRIMARY KEY, name TEXT);
CREATE TABLE orders (id SERIAL PRIMARY KEY, product_id INT);',
    'INSERT INTO products (name) VALUES (''iPhone''), (''iPad''), (''MacBook'');
INSERT INTO orders (product_id) VALUES (1), (1), (2);',
    'SELECT name FROM products LEFT JOIN orders ON products.id = orders.product_id WHERE orders.id IS NULL;',
    'Use a LEFT JOIN and check for NULL values on the right side.',
    false,
    40
),
(
    'department-avg-salary-vs-total',
    'Department vs Global Avg Salary',
    'medium',
    'subquery',
    'Show each employee''s name, their department name, their salary, and the average salary of the entire company for comparison.',
    'CREATE TABLE employees (id SERIAL PRIMARY KEY, name TEXT, salary INT, dept_id INT);
CREATE TABLE depts (id SERIAL PRIMARY KEY, name TEXT);',
    'INSERT INTO depts (name) VALUES (''HR''), (''Ops'');
INSERT INTO employees (name, salary, dept_id) VALUES (''Ann'', 50000, 1), (''Bill'', 60000, 2), (''Cat'', 70000, 2);',
    'SELECT e.name, d.name, e.salary, (SELECT AVG(salary) FROM employees) as global_avg FROM employees e JOIN depts d ON e.dept_id = d.id;',
    'A subquery in the SELECT list can calculate the global average.',
    false,
    41
),
(
    'second-highest-salary',
    'Second Highest Salary',
    'medium',
    'subquery',
    'Write a query to find the second highest salary from the employees table. If there is no second highest, return NULL.',
    'CREATE TABLE employees (id SERIAL PRIMARY KEY, salary INT);',
    'INSERT INTO employees (salary) VALUES (100), (200), (300);',
    'SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);',
    'Find the max salary that is less than the overall max salary.',
    false,
    42
),
(
    'project-budget-tracker',
    'Project Budget Overrun',
    'hard',
    'joins',
    'Find projects where the total salary of employees assigned to it exceeds the project budget.',
    'CREATE TABLE projects (id SERIAL PRIMARY KEY, title TEXT, budget INT);
CREATE TABLE employees (id SERIAL PRIMARY KEY, name TEXT, salary INT);
CREATE TABLE project_members (project_id INT, emp_id INT);',
    'INSERT INTO projects (title, budget) VALUES (''AI'', 100000), (''Web'', 50000);
INSERT INTO employees (name, salary) VALUES (''Tim'', 60000), (''Sue'', 70000);
INSERT INTO project_members VALUES (1, 1), (1, 2), (2, 1);',
    'SELECT p.title FROM projects p JOIN project_members pm ON p.id = pm.project_id JOIN employees e ON pm.emp_id = e.id GROUP BY p.id, p.title, p.budget HAVING SUM(e.salary) > p.budget;',
    'Join projects to employees via the junction table, then use HAVING SUM.',
    false,
    43
),
(
    'customer-last-order',
    'Customers Last Order',
    'medium',
    'aggregate',
    'List all customers and the date of their most recent order. If they never ordered, show NULL.',
    'CREATE TABLE customers (id SERIAL PRIMARY KEY, name TEXT);
CREATE TABLE orders (id SERIAL PRIMARY KEY, customer_id INT, order_date DATE);',
    'INSERT INTO customers (name) VALUES (''Alice''), (''Bob''), (''Charlie'');
INSERT INTO orders (customer_id, order_date) VALUES (1, ''2023-01-01''), (1, ''2023-02-01''), (2, ''2023-01-15'');',
    'SELECT c.name, MAX(o.order_date) FROM customers c LEFT JOIN orders o ON c.id = o.customer_id GROUP BY c.id, c.name;',
    'Use LEFT JOIN and MAX(order_date).',
    false,
    44
),
(
    'consecutive-available-seats',
    'Consecutive Available Seats',
    'hard',
    'window',
    'Find all seat IDs that are available and have at least one other available seat next to them.',
    'CREATE TABLE cinema (seat_id INT PRIMARY KEY, free BOOLEAN);',
    'INSERT INTO cinema VALUES (1, true), (2, false), (3, true), (4, true), (5, true);',
    'WITH checked AS (SELECT seat_id, free, LAG(free) OVER (ORDER BY seat_id) as prev, LEAD(free) OVER (ORDER BY seat_id) as next FROM cinema) SELECT seat_id FROM checked WHERE free = true AND (prev = true OR next = true) ORDER BY seat_id;',
    'Use LAG() and LEAD() window functions to check neighbors.',
    true,
    45
),
(
    'salary-percentile',
    'Salary Percentile',
    'hard',
    'window',
    'Calculate the salary percentile for each employee within their department.',
    'CREATE TABLE employees (id SERIAL PRIMARY KEY, name TEXT, salary INT, dept_id INT);',
    'INSERT INTO employees (name, salary, dept_id) VALUES (''A'', 5000, 1), (''B'', 10000, 1), (''C'', 15000, 1), (''D'', 20000, 1);',
    'SELECT name, PERCENT_RANK() OVER (PARTITION BY dept_id ORDER BY salary) FROM employees;',
    'PostgreSQL has a built-in PERCENT_RANK() function.',
    false,
    46
),
(
    'overlapping-events',
    'Overlapping Events',
    'hard',
    'joins',
    'Find pairs of event IDs that overlap in time. An overlap occurs if event A starts before event B ends, and event B starts before event A ends.',
    'CREATE TABLE events (id SERIAL PRIMARY KEY, start_time TIMESTAMP, end_time TIMESTAMP);',
    'INSERT INTO events (start_time, end_time) VALUES (''2023-01-01 10:00'', ''2023-01-01 12:00''), (''2023-01-01 11:00'', ''2023-01-01 13:00''), (''2023-01-01 14:00'', ''2023-01-01 15:00'');',
    'SELECT a.id, b.id FROM events a JOIN events b ON a.id < b.id WHERE a.start_time < b.end_time AND b.start_time < a.end_time;',
    'Self-join the table where a.id < b.id to avoid duplicate pairs.',
    false,
    47
),
(
    'customer-loyalty',
    'High-Value Customers',
    'medium',
    'aggregate',
    'Find customers who have spent more than the average total spending of all customers.',
    'CREATE TABLE customers (id SERIAL PRIMARY KEY, name TEXT);
CREATE TABLE orders (id SERIAL PRIMARY KEY, customer_id INT, total_spent INT);',
    'INSERT INTO customers (name) VALUES (''Joe''), (''Kim''), (''Lee'');
INSERT INTO orders (customer_id, total_spent) VALUES (1, 100), (1, 200), (2, 500), (3, 50);',
    'WITH spending AS (SELECT customer_id, SUM(total_spent) as total FROM orders GROUP BY customer_id) SELECT c.name FROM customers c JOIN spending s ON c.id = s.customer_id WHERE s.total > (SELECT AVG(total) FROM spending);',
    'Calculate total spending per customer first using a CTE.',
    false,
    48
),
(
    'employee-hiring-trends',
    'Hiring Trends by Year',
    'medium',
    'aggregate',
    'Count how many employees were hired each year, but only for years where more than 1 employee was hired.',
    'CREATE TABLE employees (id SERIAL PRIMARY KEY, name TEXT, hire_date DATE);',
    'INSERT INTO employees (name, hire_date) VALUES (''A'', ''2020-01-01''), (''B'', ''2020-05-01''), (''C'', ''2021-03-01''), (''D'', ''2022-01-01''), (''E'', ''2022-12-01'');',
    'SELECT EXTRACT(YEAR FROM hire_date) as year, COUNT(*) FROM employees GROUP BY 1 HAVING COUNT(*) > 1;',
    'Use EXTRACT(YEAR FROM ...) and HAVING.',
    true,
    49
),
(
    'inventory-stock-alert',
    'Inventory Stock Alert',
    'easy',
    'filtering',
    'Select all products that have a stock level below 10 and are not discontinued.',
    'CREATE TABLE products (id SERIAL PRIMARY KEY, name TEXT, stock INT, discontinued BOOLEAN);',
    'INSERT INTO products (name, stock, discontinued) VALUES (''Laptop'', 5, false), (''Mouse'', 50, false), (''Phone'', 2, true);',
    'SELECT name FROM products WHERE stock < 10 AND discontinued = false;',
    'Use simple AND condition.',
    false,
    50
)
ON CONFLICT (slug) DO NOTHING;
