# DevPulse Development TODO

This document tracks the roadmap for enhancing the **Admin Role** and **System Organization** to solve the issue of feature clutter ("everything is mixed together").

## 1. Content Organization (Sidebar Grouping)
Goal: Group navigation items into logical categories to improve UX and reduce clutter.

- [x] **Database Migration**
    - Add `group_name` (TEXT) column to `navigation_items` table.
    - Seed default groups: `Overview`, `Development`, `Projects`, `Lifestyle`, `System`.
    - Update existing items with appropriate `group_name`.
- [x] **Backend Updates**
    - Update `models/navigation.go` to include `GroupName`.
    - Update `repository/navigation_repo.go` to fetch and save `group_name`.
    - Update `handlers/admin.go` to allow updating `group_name` via API.
    - New endpoints: `PATCH /api/admin/navigation/{id}/group`, `GET /api/admin/navigation/groups`.
- [x] **Frontend Sidebar (`AppSidebar.tsx`)**
    - Sidebar groups items by `group_name` with section headers.
    - Both desktop and mobile sidebars updated.
- [x] **Admin Navigation Manager (`/admin/navigation`)**
    - Group selector dropdown per nav item.
    - Predefined groups: Overview, Development, Projects, Lifestyle, System, Ungrouped.

## 2. User Management (Admin Only)
Goal: Allow Admins to manage users and roles through the UI.

- [x] **Database Migration**
    - Added `is_active` (BOOLEAN) column to `users` table.
- [x] **Backend API**
    - `GET /api/admin/users`: List all users with profiles and roles.
    - `PATCH /api/admin/users/{id}/role`: Change a user's role (`user` vs `admin`).
    - `PATCH /api/admin/users/{id}/active`: Toggle user active status.
    - `DELETE /api/admin/users/{id}`: Delete a user account.
    - Session invalidation on role change, deactivation, or deletion.
    - `FindValid` rejects inactive users (returns 401).
- [x] **Admin UI (`/admin/users`)**
    - User management table with avatar, name, email, role, status, join date.
    - Search input filtering by email/name.
    - Role dropdown, active toggle, delete with AlertDialog.
    - Self-protection: cannot change own role, deactivate self, or delete self.

## 3. Content Moderation & Curation
Goal: Empower Admins to maintain the quality of shared content.

- [x] **Snippet Moderation**
    - Added `is_verified`, `verified_by`, `verified_at` columns to `snippets` table.
    - Admin UI (`/admin/snippets`) to toggle verification and delete public snippets.
    - Verification badge shown on snippets.
- [x] **SQL Challenge Management**
    - Admin UI (`/admin/challenges`) to create/edit/delete SQL challenges via CRUD dialog.
    - "Test Solution" button runs schema + seed + solution in a rolled-back transaction.
    - Endpoints: `POST/PUT/DELETE /api/admin/challenges`, `POST /api/admin/challenges/test`.

## 4. Security & Audit
Goal: Visibility into sensitive operations.

- [x] **Vault Audit Logs**
    - `vault_audit_logs` table tracking vault access (view, add/update/delete variable, import).
    - Per-vault audit log visible to vault owner: `GET /api/env-vaults/{id}/audit`.
    - Admin-only global view: `GET /api/admin/audit/vaults`.
- [x] **System Stats Dashboard**
    - Admin page (`/admin/stats`) with overview cards (users, content counts, sessions).
    - User growth bar chart (last 30 days).
    - Feature usage horizontal bar chart (items per feature).

## 5. Feature Toggling & Maintenance
- [x] **System Settings**
    - `system_settings` key-value table for maintenance mode, announcements.
    - `feature_toggles` table for per-module enable/disable.
- [x] **Maintenance Mode**
    - Toggle + custom message, managed via `/admin/settings`.
- [x] **Announcement Banner**
    - Global banner at top of every page (info/warning/error/success types).
    - Live preview in admin settings.
    - Fetched via `GET /api/system/announcement` for all authenticated users.
- [x] **Feature Toggles**
    - Per-module enable/disable with custom "disabled" message.
    - Admin UI in `/admin/settings` to toggle each module.
    - Public endpoint: `GET /api/system/features`.

## 6. Multi-language Support (i18n) - Hybrid Approach
Goal: Support Thai (TH) and English (EN) for UI components while keeping complex technical content in English for Phase 1.

- [ ] **Database & Backend**
    - Add `preferred_language` (TEXT, default 'en') to `profiles` table.
    - Update `models/profile.go` and `repository/profile_repo.go` to handle the new field.
    - Update `PUT /api/profile` handler to allow users to save their language preference.
- [ ] **Frontend Infrastructure**
    - Setup i18n framework (e.g., `next-intl` or custom `I18nProvider`).
    - Create translation dictionary files: `src/lib/i18n/locales/en.json` and `th.json`.
    - Define base translation keys for Sidebar groups, Common buttons (Save, Cancel, Delete), and Toast messages.
- [ ] **Frontend UI Implementation**
    - Replace hardcoded strings in `AppSidebar.tsx` and `MobileSidebar.tsx` with translation keys.
    - Implement a Language Switcher component in the `UserMenu` or Header.
    - Ensure the UI language synchronizes with the user's profile preference on login.
- [ ] **Hybrid Strategy (Phase 2: Content)**
    - Keep SQL Challenges and Academy content in English to maintain technical accuracy.
    - (Optional) Add fields for Thai descriptions in `sql_challenges` and `sql_lessons` for future localization.
