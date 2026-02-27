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
