# DevPulse API Endpoints

All endpoints return JSON. Protected endpoints require `session_token` cookie. Admin endpoints additionally require `role = "admin"`.

## Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (`{"status":"ok"}`) |
| POST | `/api/auth/register` | Register with email/password |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/github` | Redirect to GitHub OAuth |
| GET | `/api/auth/github/callback` | GitHub OAuth callback |

## Protected — Auth & Profile

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/me` | Current user + profile + role |
| GET/PUT | `/api/profile` | Get/update profile |
| POST | `/api/profile/avatar` | Upload avatar (multipart) |

## Protected — Code Snippets

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/snippets` | List/create snippets |
| GET | `/api/snippets/shared` | Public snippets from others |
| POST | `/api/snippets/copy/{id}` | Copy a shared snippet |
| PUT/DELETE | `/api/snippets/{id}` | Update/delete snippet |

## Protected — Calculator

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/calculations` | List/create calculations |
| DELETE | `/api/calculations/{id}` | Delete single calculation |
| DELETE | `/api/calculations` | Clear all calculations |

## Protected — Expenses

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/expenses` | List/create expenses |
| PUT/DELETE | `/api/expenses/{id}` | Update/delete expense |

## Protected — Habits

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/habits` | List/create habits |
| PUT/DELETE | `/api/habits/{id}` | Update/delete habit |
| PATCH | `/api/habits/{id}/archive` | Archive/unarchive habit |
| POST | `/api/habits/{id}/toggle` | Toggle today's completion |
| GET | `/api/habits/completions` | Get completions for date range |

## Protected — Kanban

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/kanban/boards` | List/create boards |
| GET/PUT/DELETE | `/api/kanban/boards/{id}` | Get/update/delete board (with columns & cards) |
| POST | `/api/kanban/boards/{boardId}/columns` | Create column |
| PUT/DELETE | `/api/kanban/columns/{id}` | Update/delete column |
| POST | `/api/kanban/columns/{colId}/cards` | Create card |
| PUT/DELETE | `/api/kanban/cards/{id}` | Update/delete card |
| PUT | `/api/kanban/cards/reorder` | Reorder cards (drag & drop) |

## Protected — Pomodoro

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/pomodoro/sessions` | List/create sessions |
| DELETE | `/api/pomodoro/sessions/{id}` | Delete session |
| DELETE | `/api/pomodoro/sessions` | Clear all sessions |
| GET | `/api/pomodoro/stats` | Stats (today/week/total/streak) |

## Protected — Env Vault

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/env-vaults` | List/create vaults |
| GET/PUT/DELETE | `/api/env-vaults/{id}` | Get/update/delete vault |
| POST | `/api/env-vaults/{id}/variables` | Add variable to vault |
| POST | `/api/env-vaults/{id}/import` | Import variables from .env format |
| PUT/DELETE | `/api/env-variables/{id}` | Update/delete variable |
| GET | `/api/env-vaults/{id}/audit` | Get audit log for vault (owner only) |

## Protected — JSON Documents

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/json-documents` | List/create documents |
| PUT/DELETE | `/api/json-documents/{id}` | Update/delete document |

## Protected — SQL Practice

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/sql-practice/challenges` | List all challenges + user progress |
| GET | `/api/sql-practice/challenges/{slug}` | Challenge detail + submissions + adjacent navigation |
| GET | `/api/sql-practice/challenges/{slug}/preview/{tableName}` | Preview table data (first 50 rows) |
| POST | `/api/sql-practice/submit` | Submit SQL answer (judge against reference solution) |
| POST | `/api/sql-practice/run` | Run query preview (no submission saved) |
| POST | `/api/sql-practice/explain` | EXPLAIN ANALYZE query |
| GET | `/api/sql-practice/stats` | Practice stats (solved/total per difficulty, category, streak) |
| GET | `/api/sql-practice/submissions/{challengeId}` | Submission history for a challenge |
| GET | `/api/sql-practice/top-solutions/{challengeId}` | Top 10 solutions by execution time |

## Protected — SQL Academy

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/sql-practice/lessons` | List all lessons grouped by module |
| GET | `/api/sql-practice/lessons/{id}` | Get lesson detail + completion status |
| POST | `/api/sql-practice/lessons/run` | Execute query against lesson schema |
| POST | `/api/sql-practice/lessons/{id}/complete` | Mark lesson as complete |

## Protected — Navigation

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/navigation` | Get visible nav items (filtered by user role, grouped) |

## Protected — Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/stats` | Dashboard stats (snippets, expenses, habits, boards) |
| GET | `/api/dashboard/recent` | Recent snippets + daily SQL challenge |

## Protected — System (All Users)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/system/announcement` | Get current announcement banner |
| GET | `/api/system/features` | Get feature toggle statuses |

## Admin Only — Navigation

Requires `role = "admin"`. Returns 403 for non-admin users.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/navigation` | List all navigation items (including hidden) |
| PATCH | `/api/admin/navigation/{id}/toggle` | Toggle navigation item visibility |
| PATCH | `/api/admin/navigation/{id}/group` | Update navigation item group |
| GET | `/api/admin/navigation/groups` | List distinct group names |

## Admin Only — User Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/users` | List all users with profiles |
| PATCH | `/api/admin/users/{id}/role` | Change user role (user/admin) |
| PATCH | `/api/admin/users/{id}/active` | Toggle user active status |
| DELETE | `/api/admin/users/{id}` | Delete user account |

## Admin Only — Content Moderation

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/snippets` | List all public snippets |
| PATCH | `/api/admin/snippets/{id}/verify` | Toggle snippet verification |
| DELETE | `/api/admin/snippets/{id}` | Delete any snippet (no user_id check) |
| POST | `/api/admin/challenges` | Create SQL challenge |
| PUT | `/api/admin/challenges/{id}` | Update SQL challenge |
| DELETE | `/api/admin/challenges/{id}` | Delete SQL challenge |
| POST | `/api/admin/challenges/test` | Test challenge schema + solution |

## Admin Only — Stats & Audit

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats` | System-wide stats (users, content counts, growth, feature usage) |
| GET | `/api/admin/audit/vaults` | Global vault audit logs (last 100) |

## Admin Only — System Settings & Features

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/settings` | List all system settings |
| PUT | `/api/admin/settings` | Update a system setting (key/value) |
| GET | `/api/admin/features` | List all feature toggles |
| PATCH | `/api/admin/features/{id}` | Update feature toggle (enable/disable + message) |
| PUT | `/api/admin/announcement` | Set announcement banner (enabled, message, type) |
| PUT | `/api/admin/maintenance` | Set maintenance mode (enabled, message) |
