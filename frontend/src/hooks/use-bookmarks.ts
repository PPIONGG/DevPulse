"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { toast } from "sonner";
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
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchBookmarks = useCallback(async () => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getBookmarks(supabase, user.id);
      if (mountedRef.current) {
        setBookmarks(data);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch bookmarks");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, authLoading, supabase]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const createBookmark = useCallback(
    async (input: BookmarkInput) => {
      if (!user) return;
      const created = await createBookmarkService(supabase, user.id, input);
      if (mountedRef.current) {
        setBookmarks((prev) => [created, ...prev]);
        toast.success("Bookmark created");
      }
      return created;
    },
    [user, supabase]
  );

  const updateBookmark = useCallback(
    async (bookmarkId: string, input: Partial<BookmarkInput>) => {
      const updated = await updateBookmarkService(supabase, bookmarkId, input);
      if (mountedRef.current) {
        setBookmarks((prev) =>
          prev.map((b) => (b.id === bookmarkId ? updated : b))
        );
        toast.success("Bookmark updated");
      }
      return updated;
    },
    [supabase]
  );

  const deleteBookmark = useCallback(
    async (bookmarkId: string) => {
      await deleteBookmarkService(supabase, bookmarkId);
      if (mountedRef.current) {
        setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
        toast.success("Bookmark deleted");
      }
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
        if (mountedRef.current) {
          setBookmarks((prev) =>
            prev.map((b) =>
              b.id === bookmark.id ? { ...b, is_favorite: bookmark.is_favorite } : b
            )
          );
          toast.error("Failed to update favorite");
        }
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
