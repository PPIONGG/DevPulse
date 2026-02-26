"use client";

import { useState, useMemo } from "react";
import { Plus, Search, FileText } from "lucide-react";
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
import { ArticleCard } from "@/components/article-card";
import { ArticleForm } from "@/components/article-form";
import { useArticles } from "@/hooks/use-articles";
import type { Article, ArticleInput } from "@/lib/types/database";

export default function ArticlesPage() {
  const {
    articles,
    loading,
    createArticle,
    updateArticle,
    deleteArticle,
    toggleFavorite,
  } = useArticles();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    articles.forEach((a) => a.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [articles]);

  const [tagFilter, setTagFilter] = useState("");

  const filtered = useMemo(() => {
    let result = articles;
    if (tagFilter) {
      result = result.filter((a) => a.tags.includes(tagFilter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [articles, search, tagFilter]);

  const handleCreate = async (data: ArticleInput) => {
    await createArticle(data);
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setFormOpen(true);
  };

  const handleUpdate = async (data: ArticleInput) => {
    if (!editingArticle) return;
    await updateArticle(editingArticle.id, data);
    setEditingArticle(null);
  };

  const handleDelete = async () => {
    if (!deletingArticle) return;
    await deleteArticle(deletingArticle.id);
    setDeletingArticle(null);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingArticle(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Articles</h2>
          <p className="mt-1 text-muted-foreground">
            Your knowledge base articles.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 size-4" />
          New Article
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
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

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Loading articles...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="mb-4 size-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">
            {search || tagFilter
              ? "No matching articles"
              : "No articles yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || tagFilter
              ? "Try a different search term or filter."
              : "Create your first article to get started."}
          </p>
          {!search && !tagFilter && (
            <Button className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 size-4" />
              New Article
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onEdit={handleEdit}
              onDelete={setDeletingArticle}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      <ArticleForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        article={editingArticle}
        onSubmit={editingArticle ? handleUpdate : handleCreate}
      />

      <AlertDialog
        open={!!deletingArticle}
        onOpenChange={(open) => !open && setDeletingArticle(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete article?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deletingArticle?.title}&quot;.
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
