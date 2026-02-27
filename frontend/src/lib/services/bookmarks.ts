import { api } from "@/lib/api/client";
import type { Bookmark, BookmarkInput } from "@/lib/types/database";

export async function getBookmarks(): Promise<Bookmark[]> {
  return api.get<Bookmark[]>("/api/bookmarks");
}

export async function createBookmark(input: BookmarkInput): Promise<Bookmark> {
  return api.post<Bookmark>("/api/bookmarks", input);
}

export async function updateBookmark(
  bookmarkId: string,
  input: Partial<BookmarkInput>
): Promise<Bookmark> {
  return api.put<Bookmark>(`/api/bookmarks/${bookmarkId}`, input);
}

export async function deleteBookmark(bookmarkId: string): Promise<void> {
  await api.delete(`/api/bookmarks/${bookmarkId}`);
}
