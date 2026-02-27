"use client";

import { useState, useMemo } from "react";
import { Plus, Search, LinkIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BookmarkCard } from "@/components/bookmark-card";
import { BookmarkForm } from "@/components/bookmark-form";
import { BookmarkCardSkeleton } from "@/components/skeletons";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { toast } from "sonner";
import type { Bookmark, BookmarkInput } from "@/lib/types/database";

export default function BookmarksPage() {
  const {
    bookmarks,
    loading,
    error,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    toggleFavorite,
    refetch,
  } = useBookmarks();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [deletingBookmark, setDeletingBookmark] = useState<Bookmark | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    bookmarks.forEach((b) => b.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [bookmarks]);

  const [tagFilter, setTagFilter] = useState("");

  const filtered = useMemo(() => {
    let result = bookmarks;
    if (tagFilter) {
      result = result.filter((b) => b.tags.includes(tagFilter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [bookmarks, search, tagFilter]);

  const handleCreate = async (data: BookmarkInput) => {
    await createBookmark(data);
  };

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setFormOpen(true);
  };

  const handleUpdate = async (data: BookmarkInput) => {
    if (!editingBookmark) return;
    await updateBookmark(editingBookmark.id, data);
    setEditingBookmark(null);
  };

  const handleDelete = async () => {
    if (!deletingBookmark) return;
    try {
      await deleteBookmark(deletingBookmark.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete bookmark");
    } finally {
      setDeletingBookmark(null);
    }
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingBookmark(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bookmarks</h2>
          <p className="mt-1 text-muted-foreground">
            Save and organize your bookmarked resources.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 size-4" />
          New Bookmark
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search bookmarks..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {allTags.length > 0 && (
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          >
            <option value="">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{error}</p>
          <button onClick={refetch} className="mt-2 text-sm font-medium underline underline-offset-4">
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <BookmarkCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <LinkIcon className="mb-4 size-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">
            {search || tagFilter
              ? "No matching bookmarks"
              : "No bookmarks yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || tagFilter
              ? "Try a different search term or filter."
              : "Save your first bookmark to get started."}
          </p>
          {!search && !tagFilter && (
            <Button className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 size-4" />
              New Bookmark
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onEdit={handleEdit}
              onDelete={setDeletingBookmark}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      <BookmarkForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        bookmark={editingBookmark}
        onSubmit={editingBookmark ? handleUpdate : handleCreate}
      />

      <AlertDialog
        open={!!deletingBookmark}
        onOpenChange={(open) => !open && setDeletingBookmark(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bookmark?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deletingBookmark?.title}&quot;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
