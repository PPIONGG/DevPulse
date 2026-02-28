-- SQL Practice tables

CREATE TABLE IF NOT EXISTS sql_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    category TEXT NOT NULL CHECK (category IN ('select', 'filtering', 'joins', 'aggregate', 'subquery', 'window', 'cte')),
    description TEXT NOT NULL,
    table_schema TEXT NOT NULL,
    seed_data TEXT NOT NULL,
    solution_sql TEXT NOT NULL,
    hint TEXT NOT NULL DEFAULT '',
    order_sensitive BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sql_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES sql_challenges(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('correct', 'wrong', 'error')),
    execution_time_ms INT,
    error_message TEXT NOT NULL DEFAULT '',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sql_submissions_user ON sql_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_sql_submissions_challenge ON sql_submissions(challenge_id);

CREATE TABLE IF NOT EXISTS sql_challenge_progress (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES sql_challenges(id) ON DELETE CASCADE,
    is_solved BOOLEAN NOT NULL DEFAULT false,
    best_time_ms INT,
    attempts INT NOT NULL DEFAULT 0,
    first_solved_at TIMESTAMPTZ,
    last_attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, challenge_id)
);

-- Seed 35 challenges

-- ============================================================
-- CATEGORY: SELECT BASICS
-- ============================================================

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'select-all-employees',
    'Select All Employees',
    'easy',
    'select',
    'Write a query to retrieve all columns and all rows from the `employees` table.',
    'CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT,
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5),
(7, ''Grace'', ''Wilson'', ''grace@company.com'', 1, 95000, ''2018-07-22'', NULL),
(8, ''Henry'', ''Moore'', ''henry@company.com'', 2, 71000, ''2022-11-30'', 3);',
    'SELECT * FROM employees;',
    'Use SELECT * to get all columns.',
    false,
    1
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'employee-names-and-salaries',
    'Employee Names & Salaries',
    'easy',
    'select',
    'Write a query to retrieve only the `first_name`, `last_name`, and `salary` columns from the `employees` table.',
    'CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT,
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL);',
    'SELECT first_name, last_name, salary FROM employees;',
    'List the column names you want separated by commas.',
    false,
    2
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'unique-departments',
    'Unique Departments',
    'easy',
    'select',
    'Write a query to get all unique (distinct) `department_id` values from the `employees` table. Return a single column named `department_id`.',
    'CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT,
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5),
(7, ''Grace'', ''Wilson'', ''grace@company.com'', 1, 95000, ''2018-07-22'', NULL);',
    'SELECT DISTINCT department_id FROM employees;',
    'Use the DISTINCT keyword after SELECT.',
    false,
    3
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'top-5-earners',
    'Top 5 Earners',
    'medium',
    'select',
    'Write a query to get the `first_name`, `last_name`, and `salary` of the top 5 highest-paid employees, sorted by salary in descending order.',
    'CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT,
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5),
(7, ''Grace'', ''Wilson'', ''grace@company.com'', 1, 95000, ''2018-07-22'', NULL),
(8, ''Henry'', ''Moore'', ''henry@company.com'', 2, 71000, ''2022-11-30'', 3);',
    'SELECT first_name, last_name, salary FROM employees ORDER BY salary DESC LIMIT 5;',
    'Use ORDER BY ... DESC and LIMIT.',
    true,
    4
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'employee-full-info',
    'Employee Full Info',
    'medium',
    'select',
    'Write a query to get each employee''s `first_name`, `last_name`, `salary`, and a calculated column `annual_bonus` which is 10% of their salary. Order by `annual_bonus` descending.',
    'CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT,
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5);',
    'SELECT first_name, last_name, salary, salary * 0.10 AS annual_bonus FROM employees ORDER BY annual_bonus DESC;',
    'Use an expression like salary * 0.10 and alias it with AS.',
    true,
    5
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- CATEGORY: WHERE & FILTERING
-- ============================================================

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'high-salary-employees',
    'High Salary Employees',
    'easy',
    'filtering',
    'Write a query to find all employees with a salary greater than 75000. Return all columns.',
    'CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT,
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5);',
    'SELECT * FROM employees WHERE salary > 75000;',
    'Use WHERE with a comparison operator.',
    false,
    6
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'engineering-department',
    'Engineering Department',
    'easy',
    'filtering',
    'Write a query to find all employees in the Engineering department (department_id = 1). Return `first_name`, `last_name`, and `salary`.',
    'CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT,
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5),
(7, ''Grace'', ''Wilson'', ''grace@company.com'', 1, 95000, ''2018-07-22'', NULL);',
    'SELECT first_name, last_name, salary FROM employees WHERE department_id = 1;',
    'Use WHERE column = value to filter.',
    false,
    7
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'salary-range',
    'Salary Range',
    'medium',
    'filtering',
    'Write a query to find employees with a salary between 70000 and 90000 (inclusive). Return `first_name`, `last_name`, and `salary`, ordered by salary ascending.',
    'CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT,
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5),
(7, ''Grace'', ''Wilson'', ''grace@company.com'', 1, 95000, ''2018-07-22'', NULL),
(8, ''Henry'', ''Moore'', ''henry@company.com'', 2, 71000, ''2022-11-30'', 3);',
    'SELECT first_name, last_name, salary FROM employees WHERE salary BETWEEN 70000 AND 90000 ORDER BY salary ASC;',
    'Use BETWEEN ... AND ... for range filtering.',
    true,
    8
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'name-search',
    'Name Search',
    'medium',
    'filtering',
    'Write a query to find all employees whose `last_name` starts with the letter ''W''. Return `first_name`, `last_name`, and `email`.',
    'CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT,
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5),
(7, ''Grace'', ''Wilson'', ''grace@company.com'', 1, 95000, ''2018-07-22'', NULL),
(8, ''Henry'', ''Walker'', ''henry@company.com'', 2, 71000, ''2022-11-30'', 3);',
    'SELECT first_name, last_name, email FROM employees WHERE last_name LIKE ''W%'';',
    'Use LIKE with a wildcard pattern: ''W%'' matches strings starting with W.',
    false,
    9
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'missing-managers',
    'Missing Managers',
    'hard',
    'filtering',
    'Write a query to find employees who have no manager (manager_id IS NULL) AND earn more than 80000, OR employees in department 3 regardless of salary. Return `first_name`, `last_name`, `salary`, `department_id`, and `manager_id`.',
    'CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT,
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5),
(7, ''Grace'', ''Wilson'', ''grace@company.com'', 1, 95000, ''2018-07-22'', NULL),
(8, ''Henry'', ''Moore'', ''henry@company.com'', 2, 71000, ''2022-11-30'', 3);',
    'SELECT first_name, last_name, salary, department_id, manager_id FROM employees WHERE (manager_id IS NULL AND salary > 80000) OR department_id = 3;',
    'Combine IS NULL with AND/OR. Use parentheses to group conditions correctly.',
    false,
    10
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- CATEGORY: JOINS
-- ============================================================

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'employees-with-departments',
    'Employees with Departments',
    'easy',
    'joins',
    'Write a query to get each employee''s `first_name`, `last_name`, and their department `name`. Use an INNER JOIN between `employees` and `departments`.',
    'CREATE TEMP TABLE departments (
    id INT PRIMARY KEY,
    name TEXT NOT NULL,
    budget NUMERIC(12,2) NOT NULL,
    location TEXT NOT NULL
);
CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT REFERENCES departments(id),
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO departments VALUES
(1, ''Engineering'', 500000, ''Building A''),
(2, ''Marketing'', 300000, ''Building B''),
(3, ''Sales'', 400000, ''Building C'');
INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL);',
    'SELECT e.first_name, e.last_name, d.name FROM employees e INNER JOIN departments d ON e.department_id = d.id;',
    'Use INNER JOIN ... ON to combine two tables on a matching column.',
    false,
    11
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'all-departments-with-employees',
    'All Departments with Employees',
    'easy',
    'joins',
    'Write a query to show all departments and their employees. Include departments that have no employees. Return `department name`, `first_name`, and `last_name`. Use a LEFT JOIN.',
    'CREATE TEMP TABLE departments (
    id INT PRIMARY KEY,
    name TEXT NOT NULL,
    budget NUMERIC(12,2) NOT NULL,
    location TEXT NOT NULL
);
CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT REFERENCES departments(id),
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO departments VALUES
(1, ''Engineering'', 500000, ''Building A''),
(2, ''Marketing'', 300000, ''Building B''),
(3, ''Sales'', 400000, ''Building C''),
(4, ''HR'', 200000, ''Building A'');
INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL);',
    'SELECT d.name, e.first_name, e.last_name FROM departments d LEFT JOIN employees e ON d.id = e.department_id;',
    'LEFT JOIN keeps all rows from the left table even when there is no match.',
    false,
    12
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'customer-orders',
    'Customer Orders',
    'medium',
    'joins',
    'Write a query to get each customer''s `name` and the `total_amount` of their orders, but only for orders with status ''completed''. Return `name` and `total_amount`.',
    'CREATE TEMP TABLE customers (
    id INT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    created_at DATE NOT NULL
);
CREATE TEMP TABLE orders (
    id INT PRIMARY KEY,
    customer_id INT REFERENCES customers(id),
    product_id INT,
    quantity INT NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    order_date DATE NOT NULL,
    status TEXT NOT NULL
);',
    'INSERT INTO customers VALUES
(1, ''John Doe'', ''john@email.com'', ''New York'', ''USA'', ''2023-01-01''),
(2, ''Jane Roe'', ''jane@email.com'', ''London'', ''UK'', ''2023-02-15''),
(3, ''Jim Beam'', ''jim@email.com'', ''Tokyo'', ''Japan'', ''2023-03-20'');
INSERT INTO orders VALUES
(1, 1, 101, 2, 150.00, ''2024-01-10'', ''completed''),
(2, 1, 102, 1, 89.99, ''2024-01-15'', ''pending''),
(3, 2, 101, 3, 225.00, ''2024-02-01'', ''completed''),
(4, 2, 103, 1, 45.00, ''2024-02-10'', ''completed''),
(5, 3, 102, 2, 179.98, ''2024-03-01'', ''cancelled''),
(6, 3, 101, 1, 75.00, ''2024-03-15'', ''completed'');',
    'SELECT c.name, o.total_amount FROM customers c INNER JOIN orders o ON c.id = o.customer_id WHERE o.status = ''completed'';',
    'JOIN the tables first, then filter with WHERE.',
    false,
    13
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'employees-and-managers',
    'Employees and Their Managers',
    'medium',
    'joins',
    'Write a query that shows each employee''s `first_name` as `employee_name` and their manager''s `first_name` as `manager_name`. Include employees with no manager (show NULL). Use a self-join.',
    'CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT,
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5);',
    'SELECT e.first_name AS employee_name, m.first_name AS manager_name FROM employees e LEFT JOIN employees m ON e.manager_id = m.id;',
    'A self-join joins a table to itself. Use aliases (e for employee, m for manager).',
    false,
    14
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'full-company-report',
    'Full Company Report',
    'hard',
    'joins',
    'Write a query that returns each employee''s `first_name`, `last_name`, their department `name` as `department`, their manager''s `first_name` as `manager_name`, and their salary. Include all employees even if they have no manager. Order by department name, then salary descending.',
    'CREATE TEMP TABLE departments (
    id INT PRIMARY KEY,
    name TEXT NOT NULL,
    budget NUMERIC(12,2) NOT NULL,
    location TEXT NOT NULL
);
CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT REFERENCES departments(id),
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO departments VALUES
(1, ''Engineering'', 500000, ''Building A''),
(2, ''Marketing'', 300000, ''Building B''),
(3, ''Sales'', 400000, ''Building C'');
INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5),
(7, ''Grace'', ''Wilson'', ''grace@company.com'', 1, 95000, ''2018-07-22'', NULL);',
    'SELECT e.first_name, e.last_name, d.name AS department, m.first_name AS manager_name, e.salary FROM employees e INNER JOIN departments d ON e.department_id = d.id LEFT JOIN employees m ON e.manager_id = m.id ORDER BY d.name, e.salary DESC;',
    'Combine INNER JOIN (for departments) with LEFT JOIN (for managers). Use ORDER BY with multiple columns.',
    true,
    15
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- CATEGORY: AGGREGATION
-- ============================================================

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'department-employee-count',
    'Department Employee Count',
    'easy',
    'aggregate',
    'Write a query to count the number of employees in each department. Return `department_id` and the count as `employee_count`.',
    'CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT,
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5),
(7, ''Grace'', ''Wilson'', ''grace@company.com'', 1, 95000, ''2018-07-22'', NULL);',
    'SELECT department_id, COUNT(*) AS employee_count FROM employees GROUP BY department_id;',
    'Use COUNT(*) with GROUP BY.',
    false,
    16
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'average-salary-by-department',
    'Average Salary by Department',
    'easy',
    'aggregate',
    'Write a query to get the average salary for each department. Return the department `name` and `avg_salary` (use ROUND to 2 decimal places). Join with the departments table.',
    'CREATE TEMP TABLE departments (
    id INT PRIMARY KEY,
    name TEXT NOT NULL,
    budget NUMERIC(12,2) NOT NULL,
    location TEXT NOT NULL
);
CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT REFERENCES departments(id),
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO departments VALUES
(1, ''Engineering'', 500000, ''Building A''),
(2, ''Marketing'', 300000, ''Building B''),
(3, ''Sales'', 400000, ''Building C'');
INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5),
(7, ''Grace'', ''Wilson'', ''grace@company.com'', 1, 95000, ''2018-07-22'', NULL);',
    'SELECT d.name, ROUND(AVG(e.salary), 2) AS avg_salary FROM employees e INNER JOIN departments d ON e.department_id = d.id GROUP BY d.name;',
    'Use AVG() with GROUP BY and ROUND() for formatting.',
    false,
    17
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'order-statistics',
    'Order Statistics',
    'medium',
    'aggregate',
    'Write a query to get each customer''s order summary: `customer_id`, total number of orders as `order_count`, total spent as `total_spent`, and average order amount as `avg_order` (rounded to 2 decimal places).',
    'CREATE TEMP TABLE orders (
    id INT PRIMARY KEY,
    customer_id INT NOT NULL,
    product_id INT,
    quantity INT NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    order_date DATE NOT NULL,
    status TEXT NOT NULL
);',
    'INSERT INTO orders VALUES
(1, 1, 101, 2, 150.00, ''2024-01-10'', ''completed''),
(2, 1, 102, 1, 89.99, ''2024-01-15'', ''completed''),
(3, 1, 103, 3, 225.00, ''2024-02-01'', ''completed''),
(4, 2, 101, 1, 75.00, ''2024-02-10'', ''completed''),
(5, 2, 102, 2, 179.98, ''2024-03-01'', ''completed''),
(6, 3, 101, 1, 75.00, ''2024-03-15'', ''completed''),
(7, 3, 103, 4, 300.00, ''2024-04-01'', ''pending'');',
    'SELECT customer_id, COUNT(*) AS order_count, SUM(total_amount) AS total_spent, ROUND(AVG(total_amount), 2) AS avg_order FROM orders GROUP BY customer_id;',
    'Use COUNT, SUM, and AVG together with GROUP BY.',
    false,
    18
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'top-selling-products',
    'Top Selling Products',
    'medium',
    'aggregate',
    'Write a query to find the top 3 best-selling products by total quantity sold. Return `product_name`, total `quantity_sold`, and total `revenue`. Order by quantity_sold descending.',
    'CREATE TEMP TABLE products (
    id INT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    stock_quantity INT NOT NULL
);
CREATE TEMP TABLE orders (
    id INT PRIMARY KEY,
    customer_id INT NOT NULL,
    product_id INT REFERENCES products(id),
    quantity INT NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    order_date DATE NOT NULL,
    status TEXT NOT NULL
);',
    'INSERT INTO products VALUES
(1, ''Laptop'', ''Electronics'', 999.99, 50),
(2, ''Mouse'', ''Electronics'', 29.99, 200),
(3, ''Keyboard'', ''Electronics'', 79.99, 150),
(4, ''Monitor'', ''Electronics'', 349.99, 75),
(5, ''Headphones'', ''Electronics'', 149.99, 100);
INSERT INTO orders VALUES
(1, 1, 1, 2, 1999.98, ''2024-01-10'', ''completed''),
(2, 2, 2, 5, 149.95, ''2024-01-15'', ''completed''),
(3, 3, 3, 3, 239.97, ''2024-02-01'', ''completed''),
(4, 1, 2, 10, 299.90, ''2024-02-10'', ''completed''),
(5, 2, 1, 1, 999.99, ''2024-03-01'', ''completed''),
(6, 3, 4, 2, 699.98, ''2024-03-15'', ''completed''),
(7, 1, 3, 4, 319.96, ''2024-04-01'', ''completed''),
(8, 2, 5, 6, 899.94, ''2024-04-15'', ''completed'');',
    'SELECT p.name AS product_name, SUM(o.quantity) AS quantity_sold, SUM(o.total_amount) AS revenue FROM orders o INNER JOIN products p ON o.product_id = p.id GROUP BY p.name ORDER BY quantity_sold DESC LIMIT 3;',
    'JOIN orders with products, GROUP BY product name, then ORDER BY and LIMIT.',
    true,
    19
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'departments-above-average',
    'Departments Above Average',
    'hard',
    'aggregate',
    'Write a query to find departments where the average salary is above the overall company average salary. Return `department_id` and `avg_salary` (rounded to 2 decimal places).',
    'CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT,
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5),
(7, ''Grace'', ''Wilson'', ''grace@company.com'', 1, 95000, ''2018-07-22'', NULL);',
    'SELECT department_id, ROUND(AVG(salary), 2) AS avg_salary FROM employees GROUP BY department_id HAVING AVG(salary) > (SELECT AVG(salary) FROM employees);',
    'Use HAVING to filter groups. The overall average can be a subquery.',
    false,
    20
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- CATEGORY: SUBQUERIES
-- ============================================================

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'above-average-salary',
    'Above Average Salary',
    'easy',
    'subquery',
    'Write a query to find all employees whose salary is above the average salary. Return `first_name`, `last_name`, and `salary`.',
    'CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT,
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5);',
    'SELECT first_name, last_name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);',
    'Use a subquery in the WHERE clause to calculate the average.',
    false,
    21
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'employees-in-large-departments',
    'Employees in Large Departments',
    'easy',
    'subquery',
    'Write a query to find employees who work in departments that have more than 2 employees. Return `first_name`, `last_name`, and `department_id`. Use an IN subquery.',
    'CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT,
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5),
(7, ''Grace'', ''Wilson'', ''grace@company.com'', 1, 95000, ''2018-07-22'', NULL);',
    'SELECT first_name, last_name, department_id FROM employees WHERE department_id IN (SELECT department_id FROM employees GROUP BY department_id HAVING COUNT(*) > 2);',
    'Use a subquery with GROUP BY and HAVING to find departments with more than 2 employees, then use IN.',
    false,
    22
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'latest-order-per-customer',
    'Latest Order per Customer',
    'medium',
    'subquery',
    'Write a query to get each customer''s most recent order. Return `customer_id`, `order_date`, and `total_amount`. Use a correlated subquery.',
    'CREATE TEMP TABLE orders (
    id INT PRIMARY KEY,
    customer_id INT NOT NULL,
    product_id INT,
    quantity INT NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    order_date DATE NOT NULL,
    status TEXT NOT NULL
);',
    'INSERT INTO orders VALUES
(1, 1, 101, 2, 150.00, ''2024-01-10'', ''completed''),
(2, 1, 102, 1, 89.99, ''2024-02-15'', ''completed''),
(3, 1, 103, 3, 225.00, ''2024-03-20'', ''completed''),
(4, 2, 101, 1, 75.00, ''2024-01-20'', ''completed''),
(5, 2, 102, 2, 179.98, ''2024-04-01'', ''completed''),
(6, 3, 101, 1, 75.00, ''2024-02-15'', ''completed'');',
    'SELECT customer_id, order_date, total_amount FROM orders o1 WHERE order_date = (SELECT MAX(o2.order_date) FROM orders o2 WHERE o2.customer_id = o1.customer_id);',
    'A correlated subquery references the outer query. Find the MAX date per customer.',
    false,
    23
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'products-never-ordered',
    'Products Never Ordered',
    'medium',
    'subquery',
    'Write a query to find products that have never been ordered. Return `name` and `price`.',
    'CREATE TEMP TABLE products (
    id INT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    stock_quantity INT NOT NULL
);
CREATE TEMP TABLE orders (
    id INT PRIMARY KEY,
    customer_id INT NOT NULL,
    product_id INT REFERENCES products(id),
    quantity INT NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    order_date DATE NOT NULL,
    status TEXT NOT NULL
);',
    'INSERT INTO products VALUES
(1, ''Laptop'', ''Electronics'', 999.99, 50),
(2, ''Mouse'', ''Electronics'', 29.99, 200),
(3, ''Keyboard'', ''Electronics'', 79.99, 150),
(4, ''Monitor'', ''Electronics'', 349.99, 75),
(5, ''Webcam'', ''Electronics'', 89.99, 120);
INSERT INTO orders VALUES
(1, 1, 1, 2, 1999.98, ''2024-01-10'', ''completed''),
(2, 2, 2, 5, 149.95, ''2024-01-15'', ''completed''),
(3, 3, 3, 3, 239.97, ''2024-02-01'', ''completed'');',
    'SELECT name, price FROM products p WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.product_id = p.id);',
    'Use NOT EXISTS with a correlated subquery to find products with no matching orders.',
    false,
    24
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'nth-highest-salary',
    'Second Highest Salary',
    'hard',
    'subquery',
    'Write a query to find the second highest distinct salary from the `employees` table. Return it as `second_highest_salary`. If there is no second highest, return NULL.',
    'CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT,
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5),
(7, ''Grace'', ''Wilson'', ''grace@company.com'', 1, 95000, ''2018-07-22'', NULL);',
    'SELECT MAX(salary) AS second_highest_salary FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);',
    'Find the MAX salary that is less than the overall MAX salary.',
    false,
    25
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- CATEGORY: WINDOW FUNCTIONS
-- ============================================================

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'row-numbers',
    'Row Numbers',
    'easy',
    'window',
    'Write a query to assign a row number to each employee ordered by salary descending. Return `first_name`, `salary`, and `row_num`.',
    'CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT,
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5);',
    'SELECT first_name, salary, ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num FROM employees;',
    'ROW_NUMBER() OVER (ORDER BY ...) assigns sequential numbers.',
    true,
    26
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'salary-rank-by-department',
    'Salary Rank by Department',
    'easy',
    'window',
    'Write a query to rank employees by salary within each department. Return `first_name`, `department_id`, `salary`, and `dept_rank` using DENSE_RANK(). Order by department_id, then dept_rank.',
    'CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT,
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5),
(7, ''Grace'', ''Wilson'', ''grace@company.com'', 1, 95000, ''2018-07-22'', NULL);',
    'SELECT first_name, department_id, salary, DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS dept_rank FROM employees ORDER BY department_id, dept_rank;',
    'Use DENSE_RANK() with PARTITION BY to rank within groups.',
    true,
    27
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'running-total',
    'Running Total',
    'medium',
    'window',
    'Write a query to calculate a running total of order amounts, ordered by order_date. Return `order_date`, `total_amount`, and `running_total`.',
    'CREATE TEMP TABLE orders (
    id INT PRIMARY KEY,
    customer_id INT NOT NULL,
    product_id INT,
    quantity INT NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    order_date DATE NOT NULL,
    status TEXT NOT NULL
);',
    'INSERT INTO orders VALUES
(1, 1, 101, 2, 150.00, ''2024-01-10'', ''completed''),
(2, 2, 102, 1, 89.99, ''2024-01-15'', ''completed''),
(3, 1, 103, 3, 225.00, ''2024-02-01'', ''completed''),
(4, 3, 101, 1, 75.00, ''2024-02-10'', ''completed''),
(5, 2, 102, 2, 179.98, ''2024-03-01'', ''completed''),
(6, 1, 101, 1, 75.00, ''2024-03-15'', ''completed'');',
    'SELECT order_date, total_amount, SUM(total_amount) OVER (ORDER BY order_date) AS running_total FROM orders;',
    'SUM() OVER (ORDER BY ...) creates a running total.',
    true,
    28
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'previous-order-comparison',
    'Previous Order Comparison',
    'medium',
    'window',
    'Write a query that shows each order''s `total_amount` alongside the previous order''s amount (by date) as `prev_amount`. Return `order_date`, `total_amount`, and `prev_amount`. Order by order_date.',
    'CREATE TEMP TABLE orders (
    id INT PRIMARY KEY,
    customer_id INT NOT NULL,
    product_id INT,
    quantity INT NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    order_date DATE NOT NULL,
    status TEXT NOT NULL
);',
    'INSERT INTO orders VALUES
(1, 1, 101, 2, 150.00, ''2024-01-10'', ''completed''),
(2, 2, 102, 1, 89.99, ''2024-01-15'', ''completed''),
(3, 1, 103, 3, 225.00, ''2024-02-01'', ''completed''),
(4, 3, 101, 1, 75.00, ''2024-02-10'', ''completed''),
(5, 2, 102, 2, 179.98, ''2024-03-01'', ''completed''),
(6, 1, 101, 1, 75.00, ''2024-03-15'', ''completed'');',
    'SELECT order_date, total_amount, LAG(total_amount) OVER (ORDER BY order_date) AS prev_amount FROM orders ORDER BY order_date;',
    'LAG() looks at the previous row in the window.',
    true,
    29
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'top-earner-per-department',
    'Top Earner per Department',
    'hard',
    'window',
    'Write a query to find the highest-paid employee in each department. Return `department_id`, `first_name`, `last_name`, and `salary`. If there are ties, include all tied employees. Order by department_id.',
    'CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT,
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5),
(7, ''Grace'', ''Wilson'', ''grace@company.com'', 1, 95000, ''2018-07-22'', NULL),
(8, ''Henry'', ''Moore'', ''henry@company.com'', 2, 92000, ''2022-11-30'', 3);',
    'SELECT department_id, first_name, last_name, salary FROM (SELECT department_id, first_name, last_name, salary, RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk FROM employees) ranked WHERE rnk = 1 ORDER BY department_id;',
    'Use RANK() in a subquery, then filter WHERE rnk = 1. RANK allows ties.',
    true,
    30
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- CATEGORY: CTEs
-- ============================================================

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'department-summary-cte',
    'Department Summary CTE',
    'easy',
    'cte',
    'Write a query using a CTE to first calculate the total salary per department, then select departments where the total salary exceeds 150000. Return `department_id` and `total_salary`.',
    'CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT,
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5),
(7, ''Grace'', ''Wilson'', ''grace@company.com'', 1, 95000, ''2018-07-22'', NULL);',
    'WITH dept_totals AS (SELECT department_id, SUM(salary) AS total_salary FROM employees GROUP BY department_id) SELECT department_id, total_salary FROM dept_totals WHERE total_salary > 150000;',
    'Start with WITH ... AS (...), then SELECT from the CTE.',
    false,
    31
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'multi-step-analysis',
    'Multi-Step Analysis',
    'easy',
    'cte',
    'Write a query with two CTEs: first get average salary per department (`dept_avg`), then get the overall average of those department averages (`overall_avg`). Return a single value `overall_avg_of_dept_avgs` rounded to 2 decimal places.',
    'CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT,
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5);',
    'WITH dept_avg AS (SELECT department_id, AVG(salary) AS avg_salary FROM employees GROUP BY department_id), overall_avg AS (SELECT ROUND(AVG(avg_salary), 2) AS overall_avg_of_dept_avgs FROM dept_avg) SELECT overall_avg_of_dept_avgs FROM overall_avg;',
    'Chain multiple CTEs separated by commas: WITH cte1 AS (...), cte2 AS (...) SELECT ...',
    false,
    32
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'org-chart-hierarchy',
    'Org Chart Hierarchy',
    'medium',
    'cte',
    'Write a recursive CTE to show the management hierarchy starting from employees with no manager (top-level). Return `first_name`, `manager_id`, and `level` (0 for top-level, 1 for their direct reports, etc.). Order by level, then first_name.',
    'CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT,
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', 1),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5);',
    'WITH RECURSIVE org_chart AS (SELECT id, first_name, manager_id, 0 AS level FROM employees WHERE manager_id IS NULL UNION ALL SELECT e.id, e.first_name, e.manager_id, oc.level + 1 FROM employees e INNER JOIN org_chart oc ON e.manager_id = oc.id) SELECT first_name, manager_id, level FROM org_chart ORDER BY level, first_name;',
    'Use WITH RECURSIVE: start with base case (no manager), then UNION ALL to join back.',
    true,
    33
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'moving-average-cte',
    'Moving Average with CTE',
    'medium',
    'cte',
    'Write a query using a CTE to calculate a 3-row moving average of order amounts (current row and 2 preceding). Return `order_date`, `total_amount`, and `moving_avg` (rounded to 2 decimal places). Order by order_date.',
    'CREATE TEMP TABLE orders (
    id INT PRIMARY KEY,
    customer_id INT NOT NULL,
    product_id INT,
    quantity INT NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    order_date DATE NOT NULL,
    status TEXT NOT NULL
);',
    'INSERT INTO orders VALUES
(1, 1, 101, 2, 150.00, ''2024-01-10'', ''completed''),
(2, 2, 102, 1, 89.99, ''2024-01-15'', ''completed''),
(3, 1, 103, 3, 225.00, ''2024-02-01'', ''completed''),
(4, 3, 101, 1, 75.00, ''2024-02-10'', ''completed''),
(5, 2, 102, 2, 179.98, ''2024-03-01'', ''completed''),
(6, 1, 101, 1, 75.00, ''2024-03-15'', ''completed'');',
    'WITH ordered_data AS (SELECT order_date, total_amount FROM orders ORDER BY order_date) SELECT order_date, total_amount, ROUND(AVG(total_amount) OVER (ORDER BY order_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS moving_avg FROM ordered_data ORDER BY order_date;',
    'Use AVG() OVER (ORDER BY ... ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) for a moving average.',
    true,
    34
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO sql_challenges (slug, title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order)
VALUES (
    'complex-report-cte',
    'Complex Report',
    'hard',
    'cte',
    'Write a query using CTEs to create a department report showing: `department_name`, `employee_count`, `avg_salary` (rounded to 2), `highest_salary`, and `dept_rank` (ranked by avg_salary descending). Order by dept_rank.',
    'CREATE TEMP TABLE departments (
    id INT PRIMARY KEY,
    name TEXT NOT NULL,
    budget NUMERIC(12,2) NOT NULL,
    location TEXT NOT NULL
);
CREATE TEMP TABLE employees (
    id INT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department_id INT REFERENCES departments(id),
    salary NUMERIC(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT
);',
    'INSERT INTO departments VALUES
(1, ''Engineering'', 500000, ''Building A''),
(2, ''Marketing'', 300000, ''Building B''),
(3, ''Sales'', 400000, ''Building C'');
INSERT INTO employees VALUES
(1, ''Alice'', ''Johnson'', ''alice@company.com'', 1, 85000, ''2020-03-15'', NULL),
(2, ''Bob'', ''Smith'', ''bob@company.com'', 1, 72000, ''2021-06-01'', 1),
(3, ''Carol'', ''Williams'', ''carol@company.com'', 2, 92000, ''2019-01-10'', NULL),
(4, ''David'', ''Brown'', ''david@company.com'', 2, 68000, ''2022-02-20'', 3),
(5, ''Eve'', ''Davis'', ''eve@company.com'', 3, 78000, ''2021-09-05'', NULL),
(6, ''Frank'', ''Miller'', ''frank@company.com'', 3, 65000, ''2023-01-15'', 5),
(7, ''Grace'', ''Wilson'', ''grace@company.com'', 1, 95000, ''2018-07-22'', NULL);',
    'WITH dept_stats AS (SELECT d.name AS department_name, COUNT(*) AS employee_count, ROUND(AVG(e.salary), 2) AS avg_salary, MAX(e.salary) AS highest_salary FROM employees e INNER JOIN departments d ON e.department_id = d.id GROUP BY d.name) SELECT department_name, employee_count, avg_salary, highest_salary, RANK() OVER (ORDER BY avg_salary DESC) AS dept_rank FROM dept_stats ORDER BY dept_rank;',
    'Use a CTE to aggregate first, then apply a window function on the CTE result.',
    true,
    35
) ON CONFLICT (slug) DO NOTHING;
