"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getBookmarks,
  createBookmark as createBookmarkService,
  updateBookmark as updateBookmarkService,
  deleteBookmark as deleteBookmarkService,
} from "@/lib/services/bookmarks";
import { useAuth } from "@/providers/auth-provider";
import type { Bookmark, BookmarkInput } from "@/lib/types/database";

export function useBookmarks() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getBookmarks(supabase, user.id);
      setBookmarks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch bookmarks");
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const createBookmark = useCallback(
    async (input: BookmarkInput) => {
      if (!user) return;
      const created = await createBookmarkService(supabase, user.id, input);
      setBookmarks((prev) => [created, ...prev]);
      return created;
    },
    [user, supabase]
  );

  const updateBookmark = useCallback(
    async (bookmarkId: string, input: Partial<BookmarkInput>) => {
      const updated = await updateBookmarkService(supabase, bookmarkId, input);
      setBookmarks((prev) =>
        prev.map((b) => (b.id === bookmarkId ? updated : b))
      );
      return updated;
    },
    [supabase]
  );

  const deleteBookmark = useCallback(
    async (bookmarkId: string) => {
      await deleteBookmarkService(supabase, bookmarkId);
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
    },
    [supabase]
  );

  const toggleFavorite = useCallback(
    async (bookmark: Bookmark) => {
      const newValue = !bookmark.is_favorite;
      setBookmarks((prev) =>
        prev.map((b) =>
          b.id === bookmark.id ? { ...b, is_favorite: newValue } : b
        )
      );
      try {
        await updateBookmarkService(supabase, bookmark.id, {
          is_favorite: newValue,
        });
      } catch {
        setBookmarks((prev) =>
          prev.map((b) =>
            b.id === bookmark.id ? { ...b, is_favorite: bookmark.is_favorite } : b
          )
        );
      }
    },
    [supabase]
  );

  return {
    bookmarks,
    loading,
    error,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    toggleFavorite,
    refetch: fetchBookmarks,
  };
}
