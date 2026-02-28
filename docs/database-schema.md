# DevPulse Database Schema

All IDs are UUID (`gen_random_uuid()`). All timestamps are `TIMESTAMPTZ`. Content tables have `user_id` FK with `ON DELETE CASCADE`.

Authorization is enforced in Go repository layer via `WHERE user_id = $1` on all queries. Migrations are embedded SQL files in `backend/database/migrations/` that run automatically on backend startup.

## Core Tables

| Table | Description | Key columns |
|-------|-------------|-------------|
| `users` | User accounts | email (unique), password_hash (nullable), github_id (unique, nullable), role (TEXT, default `'user'`), is_active (BOOLEAN, default `true`) |
| `sessions` | Session tokens | token (PK, 64-hex), user_id, expires_at (30 days) |
| `profiles` | User profiles | id (FK → users.id), display_name, avatar_url, email, preferred_language (TEXT, default `'en'`) |

## Feature Tables

| Table | Description | Key columns |
|-------|-------------|-------------|
| `snippets` | Code snippets | title, code, language, description, tags (TEXT[]), is_public, is_favorite, is_verified (BOOLEAN), verified_by (UUID FK), verified_at |
| `calculations` | Calculator history | expression, result |
| `expenses` | Expense tracking | title, amount (NUMERIC 10,2), currency, category, date, notes, is_recurring |
| `habits` | Habit definitions | title, description, color, frequency, target_days, is_archived |
| `habit_completions` | Habit completion records | habit_id, completed_date (unique per habit/date) |
| `kanban_boards` | Kanban boards | title, description, is_favorite |
| `kanban_columns` | Board columns | board_id, title, color, position |
| `kanban_cards` | Column cards | column_id, title, description, priority, labels (TEXT[]), due_date, position |
| `pomodoro_sessions` | Pomodoro sessions | duration, target_duration, task_label, completed_at |
| `env_vaults` | Env variable vaults | name, environment, description, is_favorite |
| `env_variables` | Vault key-value pairs | vault_id, key, value, is_secret, position (unique per vault/key) |
| `json_documents` | JSON/YAML documents | title, content, format, description, tags (TEXT[]), is_favorite |

## SQL Practice Tables

| Table | Description | Key columns |
|-------|-------------|-------------|
| `sql_challenges` | SQL challenges (seeded, 100+) | slug (unique), title, difficulty, category, description, table_schema, seed_data, solution_sql, hint, order_sensitive, sort_order |
| `sql_submissions` | User SQL submissions | user_id, challenge_id, query, status (`correct`/`wrong`/`error`), execution_time_ms, error_message, query_plan |
| `sql_challenge_progress` | Per-user challenge progress (composite PK) | user_id, challenge_id, is_solved, best_time_ms, attempts, first_solved_at |
| `sql_lessons` | SQL Academy lessons (seeded) | id (TEXT PK), module_id, module_title, title, description, content, practice_query, expected_output_json, table_schema, seed_data, sort_order |
| `sql_lesson_progress` | Lesson progress (composite PK) | user_id, lesson_id, is_completed, completed_at, last_accessed_at |

## Navigation Table

| Table | Description | Key columns |
|-------|-------------|-------------|
| `navigation_items` | Sidebar nav config | id (UUID), label, icon (Lucide name), path (unique), is_hidden, min_role (TEXT: `'user'`/`'admin'`), sort_order, group_name (TEXT, default `'Ungrouped'`) |

## Admin & System Tables

| Table | Description | Key columns |
|-------|-------------|-------------|
| `vault_audit_logs` | Env vault access audit trail | vault_id (FK), user_id (FK), action, details, ip_address, created_at. Indexed on vault_id, user_id, created_at DESC |
| `system_settings` | Key-value system config | key (PK), value, updated_at, updated_by (FK → users.id). Seeded: maintenance_mode, maintenance_message, announcement_enabled, announcement_message, announcement_type |
| `feature_toggles` | Per-module enable/disable | id (UUID), module_path (unique), is_enabled, disabled_message, updated_at, updated_by (FK → users.id). Seeded from navigation_items |

## Migration History

| # | File | Purpose |
|---|------|---------|
| 001–022 | (original migrations) | Core tables, all feature tables, SQL Practice with 35 initial challenges |
| 023 | `create_sql_academy` | `sql_lessons` + `sql_lesson_progress` tables, `query_plan` column on `sql_submissions`, 3 initial lessons |
| 024 | `seed_more_sql_academy` | 5 additional lessons (logical operators, LIKE, aggregates, GROUP BY, LEFT JOIN) |
| 025 | `mega_seed_content` | 3 more lessons (subqueries, CTEs, window functions) + 15+ new challenges |
| 026 | `expert_academy_expansion` | 6 advanced lessons (IN/BETWEEN, IS NULL, correlated subqueries, LAG/LEAD, set operations, DML) |
| 027 | `mega_challenges_batch1` | 20 new challenges, `analytics` category added to constraint |
| 028 | `mega_challenges_batch2` | 30 more challenges (total reaches 100+) |
| 029 | `add_admin_and_navigation` | `users.role` column, `navigation_items` table, 14 nav items seeded |
| 030 | `promote_first_admin` | First user (by created_at) promoted to admin |
| 031 | `add_settings_to_nav` | Settings navigation item added |
| 032 | `add_nav_groups` | `navigation_items.group_name` column, assign groups (Overview, Development, Projects, Lifestyle, System) |
| 033 | `add_user_management` | `users.is_active` column for account deactivation |
| 034 | `add_content_moderation` | `snippets.is_verified`, `verified_by`, `verified_at` columns + index |
| 035 | `create_audit_and_stats` | `vault_audit_logs` table with indexes |
| 036 | `create_system_settings` | `system_settings` + `feature_toggles` tables with seeds |
| 037 | `add_preferred_language` | `profiles.preferred_language` column (TEXT, default `'en'`) for i18n |

## Challenge Categories

- `select` — SELECT basics
- `filtering` — WHERE & filtering
- `joins` — JOINs
- `aggregate` — Aggregation (COUNT, SUM, AVG, etc.)
- `subquery` — Subqueries
- `window` — Window functions
- `cte` — Common Table Expressions
- `analytics` — Analytics & reporting

## Challenge Difficulties

- `easy` — Foundational queries
- `medium` — Multi-table, grouping, subqueries
- `hard` — Window functions, CTEs, complex analytics

## Seeded Navigation Items

| Sort | Label | Icon | Path | Group |
|------|-------|------|------|-------|
| 10 | Dashboard | LayoutDashboard | /dashboard | Overview |
| 20 | Code Snippets | Code2 | /code-snippets | Development |
| 30 | Expenses | DollarSign | /expenses | Lifestyle |
| 40 | Habits | Target | /habits | Lifestyle |
| 50 | Kanban | Kanban | /kanban | Projects |
| 60 | Pomodoro | Clock | /pomodoro | Lifestyle |
| 70 | Env Vault | ShieldCheck | /env-vault | System |
| 80 | JSON Tools | Binary | /json-tools | Development |
| 90 | API Playground | Zap | /api-playground | Development |
| 100 | Time Tracker | History | /time-tracker | Projects |
| 110 | SQL Practice | Database | /sql-practice | Development |
| 120 | Workflows | Workflow | /workflows | Projects |
| 130 | Marketplace | ShoppingBag | /marketplace | Projects |
| 140 | DB Explorer | SearchCode | /db-explorer | Development |
| 150 | Calculator | Calculator | /calculator | Development |
| 160 | Settings | Settings | /settings | System |
