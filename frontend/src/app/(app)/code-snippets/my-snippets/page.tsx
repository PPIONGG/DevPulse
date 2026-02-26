"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Code2 } from "lucide-react";
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
import { SnippetCard } from "@/components/snippet-card";
import { SnippetForm } from "@/components/snippet-form";
import { useSnippets } from "@/hooks/use-snippets";
import type { CodeSnippet, CodeSnippetInput } from "@/lib/types/database";

export default function MySnippetsPage() {
  const {
    snippets,
    loading,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    toggleFavorite,
  } = useSnippets();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<CodeSnippet | null>(
    null
  );
  const [deletingSnippet, setDeletingSnippet] = useState<CodeSnippet | null>(
    null
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return snippets;
    const q = search.toLowerCase();
    return snippets.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.language.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [snippets, search]);

  const handleCreate = async (data: CodeSnippetInput) => {
    await createSnippet(data);
  };

  const handleEdit = (snippet: CodeSnippet) => {
    setEditingSnippet(snippet);
    setFormOpen(true);
  };

  const handleUpdate = async (data: CodeSnippetInput) => {
    if (!editingSnippet) return;
    await updateSnippet(editingSnippet.id, data);
    setEditingSnippet(null);
  };

  const handleDelete = async () => {
    if (!deletingSnippet) return;
    await deleteSnippet(deletingSnippet.id);
    setDeletingSnippet(null);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingSnippet(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Snippets</h2>
          <p className="mt-1 text-muted-foreground">
            Your personal collection of code snippets.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 size-4" />
          New Snippet
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search snippets..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Loading snippets...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Code2 className="mb-4 size-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">
            {search ? "No matching snippets" : "No snippets yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search
              ? "Try a different search term."
              : "Create your first snippet to get started."}
          </p>
          {!search && (
            <Button className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 size-4" />
              New Snippet
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              onEdit={handleEdit}
              onDelete={setDeletingSnippet}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      <SnippetForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        snippet={editingSnippet}
        onSubmit={editingSnippet ? handleUpdate : handleCreate}
      />

      <AlertDialog
        open={!!deletingSnippet}
        onOpenChange={(open) => !open && setDeletingSnippet(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete snippet?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deletingSnippet?.title}&quot;.
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
