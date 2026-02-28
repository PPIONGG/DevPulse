export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
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
