import { api } from "@/lib/api/client";
import type { Article, ArticleInput } from "@/lib/types/database";

export async function getArticles(): Promise<Article[]> {
  return api.get<Article[]>("/api/articles");
}

export async function createArticle(input: ArticleInput): Promise<Article> {
  return api.post<Article>("/api/articles", input);
}

export async function updateArticle(
  articleId: string,
  input: Partial<ArticleInput>
): Promise<Article> {
  return api.put<Article>(`/api/articles/${articleId}`, input);
}

export async function deleteArticle(articleId: string): Promise<void> {
  await api.delete(`/api/articles/${articleId}`);
}
