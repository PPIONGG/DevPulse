"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Kanban, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { KanbanBoardCard } from "@/components/kanban-board-card";
import { KanbanBoardForm } from "@/components/kanban-board-form";
import { KanbanBoardView } from "@/components/kanban-board-view";
import { KanbanBoardCardSkeleton } from "@/components/skeletons";
import { useKanban } from "@/hooks/use-kanban";
import { useTranslation } from "@/providers/language-provider";
import { toast } from "sonner";
import type { KanbanBoard, KanbanBoardInput } from "@/lib/types/database";

export default function KanbanPage() {
  const {
    boards,
    loading,
    error,
    createBoard,
    updateBoard,
    deleteBoard,
    toggleFavorite,
    selectedBoard,
    boardLoading,
    selectBoard,
    createColumn,
    updateColumn,
    deleteColumn,
    createCard,
    updateCard,
    deleteCard,
    moveCards,
    refetch,
  } = useKanban();
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<KanbanBoard | null>(null);
  const [deletingBoard, setDeletingBoard] = useState<KanbanBoard | null>(null);

  const filtered = useMemo(() => {
    let result = boards;
    if (filter === "favorites") {
      result = result.filter((b) => b.is_favorite);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [boards, search, filter]);

  const hasFilters = search.trim() || filter !== "all";

  const handleCreate = async (data: KanbanBoardInput) => {
    await createBoard(data);
  };

  const handleEdit = (board: KanbanBoard) => {
    setEditingBoard(board);
    setFormOpen(true);
  };

  const handleUpdate = async (data: KanbanBoardInput) => {
    if (!editingBoard) return;
    await updateBoard(editingBoard.id, data);
    setEditingBoard(null);
  };

  const handleDelete = async () => {
    if (!deletingBoard) return;
    try {
      await deleteBoard(deletingBoard.id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("kanban.deleteFailed")
      );
    } finally {
      setDeletingBoard(null);
    }
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingBoard(null);
  };

  // Board detail view
  if (selectedBoard) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => selectBoard(null)}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {selectedBoard.title}
            </h2>
            {selectedBoard.description && (
              <p className="text-sm text-muted-foreground">
                {selectedBoard.description}
              </p>
            )}
          </div>
        </div>

        <KanbanBoardView
          board={selectedBoard}
          onCreateColumn={createColumn}
          onUpdateColumn={updateColumn}
          onDeleteColumn={deleteColumn}
          onCreateCard={createCard}
          onUpdateCard={updateCard}
          onDeleteCard={deleteCard}
          onMoveCards={moveCards}
        />
      </div>
    );
  }

  // Board list view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("kanban.title")}</h2>
          <p className="mt-1 text-muted-foreground">
            {t("kanban.subtitle")}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 size-4" />
          {t("kanban.new")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("kanban.searchPlaceholder")}
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t("kanban.allBoards")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("kanban.allBoards")}</SelectItem>
            <SelectItem value="favorites">{t("kanban.favorites")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{error}</p>
          <button
            onClick={refetch}
            className="mt-2 text-sm font-medium underline underline-offset-4"
          >
            {t("common.tryAgain")}
          </button>
        </div>
      )}

      {loading || boardLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <KanbanBoardCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Kanban className="mb-4 size-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">
            {hasFilters ? t("kanban.noMatch") : t("kanban.empty")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? t("kanban.noMatchDesc")
              : t("kanban.emptyDesc")}
          </p>
          {!hasFilters && (
            <Button className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 size-4" />
              {t("kanban.new")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((board) => (
            <KanbanBoardCard
              key={board.id}
              board={board}
              onClick={(b) => selectBoard(b.id)}
              onEdit={handleEdit}
              onDelete={setDeletingBoard}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      <KanbanBoardForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        board={editingBoard}
        onSubmit={editingBoard ? handleUpdate : handleCreate}
      />

      <AlertDialog
        open={!!deletingBoard}
        onOpenChange={(open) => !open && setDeletingBoard(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("kanban.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("kanban.deleteDescPrefix")} {deletingBoard?.title} {t("kanban.deleteDescSuffix")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
