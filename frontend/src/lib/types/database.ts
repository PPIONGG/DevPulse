export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  preferred_language: string;
}

export interface CodeSnippet {
  id: string;
  user_id: string;
  title: string;
  code: string;
  language: string;
  description: string;
  tags: string[];
  is_public: boolean;
  is_favorite: boolean;
  copied_from: string | null;
  owner_name?: string | null;
  is_verified: boolean;
  verified_by?: string | null;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type CodeSnippetInput = Pick<
  CodeSnippet,
  "title" | "code" | "language" | "description" | "tags" | "is_public" | "is_favorite"
>;

export interface Expense {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  notes: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export type ExpenseInput = Pick<
  Expense,
  "title" | "amount" | "currency" | "category" | "date" | "notes" | "is_recurring"
>;

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  description: string;
  color: string;
  frequency: "daily" | "weekdays" | "weekly";
  target_days: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export type HabitInput = Pick<
  Habit,
  "title" | "description" | "color" | "frequency" | "target_days"
>;

export interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_date: string;
  created_at: string;
}

export interface HabitWithStats extends Habit {
  completions: HabitCompletion[];
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
}

export interface KanbanBoard {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export type KanbanBoardInput = Pick<
  KanbanBoard,
  "title" | "description" | "is_favorite"
>;

export interface KanbanColumn {
  id: string;
  board_id: string;
  title: string;
  color: string;
  position: number;
  created_at: string;
}

export type KanbanColumnInput = Pick<KanbanColumn, "title" | "color">;

export interface KanbanCard {
  id: string;
  column_id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  labels: string[];
  position: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export type KanbanCardInput = Pick<
  KanbanCard,
  "title" | "description" | "priority" | "labels" | "due_date"
>;

export interface KanbanColumnWithCards extends KanbanColumn {
  cards: KanbanCard[];
}

export interface KanbanBoardFull extends KanbanBoard {
  columns: KanbanColumnWithCards[];
}

export interface Calculation {
  id: string;
  user_id: string;
  expression: string;
  result: string;
  created_at: string;
}

export interface CalculationInput {
  expression: string;
  result: string;
}

export interface EnvVariable {
  id: string;
  vault_id: string;
  key: string;
  value: string;
  is_secret: boolean;
  position: number;
  created_at: string;
}

export interface EnvVault {
  id: string;
  user_id: string;
  name: string;
  environment: string;
  description: string;
  is_favorite: boolean;
  variables: EnvVariable[];
  created_at: string;
  updated_at: string;
}

export type EnvVaultInput = Pick<
  EnvVault,
  "name" | "environment" | "description" | "is_favorite"
>;

export type EnvVariableInput = Pick<
  EnvVariable,
  "key" | "value" | "is_secret"
>;

export interface PomodoroSession {
  id: string;
  user_id: string;
  duration: number;
  target_duration: number;
  task_label: string;
  completed_at: string;
  created_at: string;
}

export type PomodoroSessionInput = Pick<
  PomodoroSession,
  "duration" | "target_duration" | "task_label"
>;

export interface PomodoroStats {
  today_sessions: number;
  today_minutes: number;
  week_sessions: number;
  week_minutes: number;
  total_sessions: number;
  current_streak: number;
}

export interface JsonDocument {
  id: string;
  user_id: string;
  title: string;
  content: string;
  format: "json" | "yaml";
  description: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export type JsonDocumentInput = Pick<
  JsonDocument,
  "title" | "content" | "format" | "description" | "tags" | "is_favorite"
>;

// --- Time Tracker ---

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  company: string;
  address: string;
  phone: string;
  notes: string;
  hourly_rate: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export type ClientInput = Pick<
  Client,
  "name" | "email" | "company" | "address" | "phone" | "notes" | "hourly_rate" | "currency"
>;

export interface Project {
  id: string;
  user_id: string;
  client_id: string | null;
  title: string;
  description: string;
  color: string;
  hourly_rate: number | null;
  budget_hours: number | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export type ProjectInput = Pick<
  Project,
  "client_id" | "title" | "description" | "color" | "hourly_rate" | "budget_hours"
>;

export interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string;
  description: string;
  start_time: string;
  end_time: string | null;
  duration: number;
  is_billable: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type TimeEntryInput = Pick<
  TimeEntry,
  "project_id" | "description" | "start_time" | "end_time" | "duration" | "is_billable" | "tags"
>;

export interface InvoiceLineItem {
  description: string;
  hours: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string | null;
  invoice_number: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  notes: string;
  line_items: InvoiceLineItem[];
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export type InvoiceInput = Pick<
  Invoice,
  "client_id" | "due_date" | "tax_rate" | "currency" | "notes" | "line_items"
>;

export interface TimeReport {
  total_hours: number;
  billable_hours: number;
  total_amount: number;
  by_project: { project_id: string; project_name: string; color: string; hours: number; amount: number }[];
  by_day: { date: string; hours: number }[];
}

// --- API Playground ---

export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

export interface ApiCollection {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_favorite: boolean;
  requests: ApiRequest[];
  created_at: string;
  updated_at: string;
}

export type ApiCollectionInput = Pick<
  ApiCollection,
  "title" | "description" | "is_favorite"
>;

export interface ApiRequest {
  id: string;
  user_id: string;
  collection_id: string | null;
  title: string;
  method: string;
  url: string;
  headers: KeyValuePair[];
  query_params: KeyValuePair[];
  body_type: string;
  body: string;
  env_vault_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ApiRequestInput = Pick<
  ApiRequest,
  | "collection_id"
  | "title"
  | "method"
  | "url"
  | "headers"
  | "query_params"
  | "body_type"
  | "body"
  | "env_vault_id"
  | "sort_order"
>;

export interface ApiRequestHistory {
  id: string;
  user_id: string;
  request_id: string | null;
  method: string;
  url: string;
  request_headers: KeyValuePair[];
  request_body: string;
  response_status: number;
  response_headers: Record<string, string>;
  response_body: string;
  response_size: number;
  response_time_ms: number;
  created_at: string;
}

export interface ApiProxyRequest {
  method: string;
  url: string;
  headers: KeyValuePair[];
  body: string;
  env_vault_id?: string | null;
  request_id?: string | null;
  timeout_secs?: number;
}

export interface ApiProxyResponse {
  status: number;
  status_text: string;
  headers: Record<string, string>;
  body: string;
  size: number;
  time_ms: number;
}

// --- Marketplace ---

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  preview_code: string;
  full_code: string;
  language: string;
  tags: string[];
  price_cents: number;
  currency: string;
  is_published: boolean;
  download_count: number;
  seller_name: string;
  avg_rating: number;
  review_count: number;
  is_purchased: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListingInput {
  title: string;
  description: string;
  preview_code: string;
  full_code: string;
  language: string;
  tags: string[];
  price_cents: number;
  currency: string;
  is_published: boolean;
}

export interface Purchase {
  id: string;
  buyer_id: string;
  listing_id: string;
  amount_cents: number;
  platform_fee_cents: number;
  currency: string;
  status: string;
  purchased_at: string | null;
  created_at: string;
  listing_title?: string;
  listing_language?: string;
  seller_name?: string;
}

export interface Review {
  id: string;
  buyer_id: string;
  listing_id: string;
  rating: number;
  comment: string;
  buyer_name: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewInput {
  rating: number;
  comment: string;
}

export interface SellerStats {
  total_sales: number;
  total_revenue: number;
  active_listings: number;
  total_listings: number;
}

// --- Workflows ---

export interface Workflow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_enabled: boolean;
  trigger_type: string;
  cron_expression: string;
  webhook_token: string | null;
  nodes: unknown;
  edges: unknown;
  last_run_at: string | null;
  last_run_status: string | null;
  run_count: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowInput {
  title: string;
  description: string;
  is_enabled: boolean;
  trigger_type: string;
  cron_expression: string;
  nodes: unknown;
  edges: unknown;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  user_id: string;
  status: string;
  trigger_type: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  error: string;
  created_at: string;
}

export interface WorkflowStepLog {
  id: string;
  run_id: string;
  node_id: string;
  node_type: string;
  status: string;
  input_data: unknown;
  output_data: unknown;
  error: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
}

// --- Database Explorer ---

export interface DBConnection {
  id: string;
  user_id: string;
  name: string;
  db_type: string;
  host: string;
  port: number;
  database_name: string;
  username: string;
  ssl_mode: string;
  is_read_only: boolean;
  color: string;
  last_connected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBConnectionInput {
  name: string;
  host: string;
  port: number;
  database_name: string;
  username: string;
  password: string;
  ssl_mode: string;
  is_read_only: boolean;
  color: string;
}

export interface TableInfo {
  name: string;
  schema: string;
  row_estimate: number;
  size_bytes: number;
}

export interface ColumnInfo {
  name: string;
  data_type: string;
  is_nullable: boolean;
  is_primary_key: boolean;
  default_value: string | null;
  ordinal_position: number;
}

export interface ForeignKeyInfo {
  column_name: string;
  foreign_table: string;
  foreign_column: string;
  constraint_name: string;
}

export interface TableDetail {
  table: TableInfo;
  columns: ColumnInfo[];
  foreign_keys: ForeignKeyInfo[];
}

export interface QueryRequest {
  connection_id: string;
  query: string;
  limit: number;
}

export interface QueryResult {
  columns: string[];
  rows: unknown[][];
  row_count: number;
  execution_time_ms: number;
  truncated: boolean;
}

export interface SavedQuery {
  id: string;
  user_id: string;
  connection_id: string | null;
  title: string;
  query: string;
  description: string;
  tags: string[];
  is_favorite: boolean;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedQueryInput {
  connection_id: string | null;
  title: string;
  query: string;
  description: string;
  tags: string[];
  is_favorite: boolean;
}

export interface QueryHistoryEntry {
  id: string;
  user_id: string;
  connection_id: string;
  query: string;
  row_count: number | null;
  execution_time_ms: number | null;
  status: string;
  error_message: string;
  created_at: string;
}

// --- SQL Practice ---

export interface ColumnMetadata {
  name: string;
  type: string;
}

export interface TableMetadata {
  name: string;
  columns: ColumnMetadata[];
}

export interface ChallengeMetadata {
  tables: TableMetadata[];
}

export interface SqlChallenge {
  id: string;
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  category: "select" | "filtering" | "joins" | "aggregate" | "subquery" | "window" | "cte";
  description: string;
  table_schema: string;
  seed_data: string;
  hint: string;
  order_sensitive: boolean;
  sort_order: number;
  created_at: string;
  metadata?: ChallengeMetadata;
}

export interface SqlChallengeProgress {
  user_id: string;
  challenge_id: string;
  is_solved: boolean;
  best_time_ms: number | null;
  attempts: number;
  first_solved_at: string | null;
  last_attempted_at: string;
}

export interface SqlChallengeWithProgress extends SqlChallenge {
  progress: SqlChallengeProgress | null;
}

export interface SqlSubmission {
  id: string;
  user_id: string;
  challenge_id: string;
  query: string;
  status: "correct" | "wrong" | "error";
  execution_time_ms: number | null;
  error_message: string;
  submitted_at: string;
}

export interface SqlSubmitRequest {
  challenge_id: string;
  query: string;
}

export interface SqlSubmitResult {
  status: "correct" | "wrong" | "error";
  user_result: QueryResult | null;
  expected_result: QueryResult | null;
  execution_time_ms: number;
  error_message: string;
  query_plan?: string;
}

export interface SqlTopSolution {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string;
  query: string;
  execution_time_ms: number;
  query_length: number;
  submitted_at: string;
}

export interface SqlPracticeCategoryStats {
  category: string;
  total: number;
  solved: number;
}

export interface SqlPracticeStats {
  total_challenges: number;
  solved: number;
  easy_total: number;
  easy_solved: number;
  medium_total: number;
  medium_solved: number;
  hard_total: number;
  hard_solved: number;
  categories: SqlPracticeCategoryStats[];
  practice_streak: number;
  total_submissions: number;
  daily_challenge?: SqlChallenge;
}

export interface SqlChallengeDetail {
  challenge: SqlChallenge;
  submissions: SqlSubmission[];
  progress: SqlChallengeProgress | null;
  prev_slug: string;
  next_slug: string;
  solution_sql: string | null;
}

export interface SqlLesson {
  id: string;
  module_id: string;
  module_title: string;
  title: string;
  description: string;
  content: string;
  practice_query: string;
  expected_output_json: string | null;
  table_schema: string;
  seed_data: string;
  sort_order: number;
  created_at: string;
  is_completed: boolean;
}

export interface SqlModuleWithLessons {
  id: string;
  title: string;
  lessons: SqlLesson[];
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  is_hidden: boolean;
  min_role: "user" | "admin";
  sort_order: number;
  group_name: string;
  created_at: string;
  updated_at: string;
}

// --- Admin Types ---

export interface AdminUserView {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface VaultAuditLog {
  id: string;
  vault_id: string;
  user_id: string;
  action: string;
  details: string;
  ip_address: string;
  user_email: string;
  display_name: string;
  created_at: string;
}

export interface DailyCountStat {
  date: string;
  count: number;
}

export interface FeatureUsageStat {
  feature: string;
  count: number;
}

export interface SystemStats {
  total_users: number;
  active_users: number;
  total_snippets: number;
  total_expenses: number;
  total_habits: number;
  total_boards: number;
  total_vaults: number;
  total_challenges: number;
  total_sessions: number;
  user_growth: DailyCountStat[];
  feature_usage: FeatureUsageStat[];
}

export interface SystemSetting {
  key: string;
  value: string;
  updated_at: string;
  updated_by?: string;
}

export interface FeatureToggle {
  id: string;
  module_path: string;
  is_enabled: boolean;
  disabled_message: string;
  updated_at: string;
  updated_by?: string;
}

export interface AnnouncementBanner {
  enabled: boolean;
  message: string;
  type: "info" | "warning" | "error" | "success";
}

export interface SqlChallengeInput {
  slug: string;
  title: string;
  difficulty: string;
  category: string;
  description: string;
  table_schema: string;
  seed_data: string;
  solution_sql: string;
  hint: string;
  order_sensitive: boolean;
  sort_order: number;
}
