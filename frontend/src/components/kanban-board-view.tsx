"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCorners,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  GripVertical,
  CalendarDays,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { KanbanCardForm } from "@/components/kanban-card-form";
import { getPriorityConfig, columnColors } from "@/config/kanban-config";
import { toast } from "sonner";
import type {
  KanbanBoardFull,
  KanbanColumnWithCards,
  KanbanCard,
  KanbanColumnInput,
  KanbanCardInput,
} from "@/lib/types/database";

// --- Sortable Card ---

function SortableCard({
  card,
  onEdit,
  onDelete,
}: {
  card: KanbanCard;
  onEdit: (card: KanbanCard) => void;
  onDelete: (card: KanbanCard) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const priority = getPriorityConfig(card.priority);

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="gap-0 py-0">
        <div className="flex items-start gap-1 px-2 py-2">
          <button
            {...listeners}
            className="mt-0.5 cursor-grab p-0.5 text-muted-foreground hover:text-foreground active:cursor-grabbing"
          >
            <GripVertical className="size-3.5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-tight">{card.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <Badge className={`text-[10px] px-1 py-0 ${priority.color}`} variant="secondary">
                {priority.label}
              </Badge>
              {card.due_date && (
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <CalendarDays className="size-2.5" />
                  {new Date(card.due_date + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
              {card.labels.map((l) => (
                <Badge key={l} variant="outline" className="text-[10px] px-1 py-0">
                  {l}
                </Badge>
              ))}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-6 shrink-0">
                <MoreVertical className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(card)}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(card)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
    </div>
  );
}

// --- Card Overlay (shown while dragging) ---

function CardOverlay({ card }: { card: KanbanCard }) {
  const priority = getPriorityConfig(card.priority);
  return (
    <Card className="w-[260px] gap-0 py-0 shadow-lg rotate-2">
      <div className="px-3 py-2">
        <p className="text-sm font-medium">{card.title}</p>
        <Badge className={`mt-1 text-[10px] px-1 py-0 ${priority.color}`} variant="secondary">
          {priority.label}
        </Badge>
      </div>
    </Card>
  );
}

// --- Main Board View ---

interface KanbanBoardViewProps {
  board: KanbanBoardFull;
  onCreateColumn: (input: KanbanColumnInput) => Promise<unknown>;
  onUpdateColumn: (colId: string, input: KanbanColumnInput) => Promise<unknown>;
  onDeleteColumn: (colId: string) => Promise<void>;
  onCreateCard: (colId: string, input: KanbanCardInput) => Promise<unknown>;
  onUpdateCard: (cardId: string, input: KanbanCardInput) => Promise<unknown>;
  onDeleteCard: (cardId: string) => Promise<void>;
  onMoveCards: (columns: KanbanColumnWithCards[]) => Promise<void>;
}

export function KanbanBoardView({
  board,
  onCreateColumn,
  onUpdateColumn,
  onDeleteColumn,
  onCreateCard,
  onUpdateCard,
  onDeleteCard,
  onMoveCards,
}: KanbanBoardViewProps) {
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [addingColumnTitle, setAddingColumnTitle] = useState("");
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [addingCardColId, setAddingCardColId] = useState<string | null>(null);
  const [addingCardTitle, setAddingCardTitle] = useState("");
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [cardFormOpen, setCardFormOpen] = useState(false);
  const [cardFormColId, setCardFormColId] = useState<string | null>(null);
  const [deletingCard, setDeletingCard] = useState<KanbanCard | null>(null);
  const [deletingColId, setDeletingColId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const findCard = useCallback(
    (id: string): KanbanCard | undefined => {
      for (const col of board.columns) {
        const card = col.cards.find((c) => c.id === id);
        if (card) return card;
      }
      return undefined;
    },
    [board.columns]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const card = findCard(String(event.active.id));
    setActiveCard(card ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Find source and target columns
    let sourceCol: KanbanColumnWithCards | undefined;
    let targetCol: KanbanColumnWithCards | undefined;

    for (const col of board.columns) {
      if (col.cards.some((c) => c.id === activeId)) sourceCol = col;
      if (col.id === overId || col.cards.some((c) => c.id === overId))
        targetCol = col;
    }

    if (!sourceCol || !targetCol || sourceCol.id === targetCol.id) return;

    // Move card between columns optimistically
    const newColumns = board.columns.map((col) => {
      if (col.id === sourceCol!.id) {
        return {
          ...col,
          cards: col.cards.filter((c) => c.id !== activeId),
        };
      }
      if (col.id === targetCol!.id) {
        const activeCardData = sourceCol!.cards.find((c) => c.id === activeId);
        if (!activeCardData) return col;
        const overIndex = col.cards.findIndex((c) => c.id === overId);
        const insertIndex = overIndex >= 0 ? overIndex : col.cards.length;
        const newCards = [...col.cards];
        newCards.splice(insertIndex, 0, activeCardData);
        return { ...col, cards: newCards };
      }
      return col;
    });

    onMoveCards(newColumns);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Find the column containing the active card
    let col: KanbanColumnWithCards | undefined;
    for (const c of board.columns) {
      if (c.cards.some((card) => card.id === activeId)) {
        col = c;
        break;
      }
    }
    if (!col) return;

    const oldIdx = col.cards.findIndex((c) => c.id === activeId);
    const newIdx = col.cards.findIndex((c) => c.id === overId);

    if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;

    // Reorder within column
    const newCards = [...col.cards];
    const [moved] = newCards.splice(oldIdx, 1);
    newCards.splice(newIdx, 0, moved);

    const newColumns = board.columns.map((c) =>
      c.id === col!.id ? { ...c, cards: newCards } : c
    );

    onMoveCards(newColumns);
  };

  const handleAddColumn = async () => {
    if (!addingColumnTitle.trim()) return;
    try {
      await onCreateColumn({
        title: addingColumnTitle.trim(),
        color: "#6b7280",
      });
      setAddingColumnTitle("");
      setShowAddColumn(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create column");
    }
  };

  const handleQuickAddCard = async (colId: string) => {
    if (!addingCardTitle.trim()) return;
    try {
      await onCreateCard(colId, {
        title: addingCardTitle.trim(),
        description: "",
        priority: "medium",
        labels: [],
        due_date: null,
      });
      setAddingCardTitle("");
      setAddingCardColId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create card");
    }
  };

  const handleEditCard = (card: KanbanCard) => {
    setEditingCard(card);
    setCardFormOpen(true);
  };

  const handleCardFormSubmit = async (data: KanbanCardInput) => {
    if (editingCard) {
      await onUpdateCard(editingCard.id, data);
    } else if (cardFormColId) {
      await onCreateCard(cardFormColId, data);
    }
    setEditingCard(null);
    setCardFormColId(null);
  };

  const handleDeleteCard = async () => {
    if (!deletingCard) return;
    try {
      await onDeleteCard(deletingCard.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete card");
    } finally {
      setDeletingCard(null);
    }
  };

  const handleDeleteColumn = async () => {
    if (!deletingColId) return;
    try {
      await onDeleteColumn(deletingColId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete column");
    } finally {
      setDeletingColId(null);
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {board.columns.map((col) => (
            <div
              key={col.id}
              className="flex w-[280px] shrink-0 flex-col rounded-lg border bg-muted/30 p-2"
            >
              {/* Column Header */}
              <div className="mb-2 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div
                    className="size-3 rounded-full"
                    style={{ backgroundColor: col.color }}
                  />
                  <h3 className="text-sm font-semibold">{col.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {col.cards.length}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-6">
                      <MoreVertical className="size-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setCardFormColId(col.id);
                        setCardFormOpen(true);
                      }}
                    >
                      <Plus className="mr-2 size-4" />
                      Add Card
                    </DropdownMenuItem>
                    {columnColors.map((cc) => (
                      <DropdownMenuItem
                        key={cc.value}
                        onClick={() =>
                          onUpdateColumn(col.id, {
                            title: col.title,
                            color: cc.value,
                          })
                        }
                      >
                        <div
                          className="mr-2 size-3 rounded-full"
                          style={{ backgroundColor: cc.value }}
                        />
                        {cc.label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeletingColId(col.id)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete Column
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Cards */}
              <SortableContext
                items={col.cards.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-1 flex-col gap-1.5 min-h-[40px]">
                  {col.cards.map((card) => (
                    <SortableCard
                      key={card.id}
                      card={card}
                      onEdit={handleEditCard}
                      onDelete={setDeletingCard}
                    />
                  ))}
                </div>
              </SortableContext>

              {/* Quick add */}
              {addingCardColId === col.id ? (
                <div className="mt-2 flex gap-1">
                  <Input
                    autoFocus
                    placeholder="Card title"
                    value={addingCardTitle}
                    onChange={(e) => setAddingCardTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleQuickAddCard(col.id);
                      if (e.key === "Escape") {
                        setAddingCardColId(null);
                        setAddingCardTitle("");
                      }
                    }}
                    className="h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    className="h-8 shrink-0"
                    onClick={() => handleQuickAddCard(col.id)}
                  >
                    Add
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 w-full justify-start text-xs text-muted-foreground"
                  onClick={() => setAddingCardColId(col.id)}
                >
                  <Plus className="mr-1 size-3" />
                  Add card
                </Button>
              )}
            </div>
          ))}

          {/* Add Column */}
          <div className="w-[280px] shrink-0">
            {showAddColumn ? (
              <div className="rounded-lg border bg-muted/30 p-2">
                <Input
                  autoFocus
                  placeholder="Column title"
                  value={addingColumnTitle}
                  onChange={(e) => setAddingColumnTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddColumn();
                    if (e.key === "Escape") {
                      setShowAddColumn(false);
                      setAddingColumnTitle("");
                    }
                  }}
                  className="mb-2 h-8 text-sm"
                />
                <div className="flex gap-1">
                  <Button size="sm" className="h-8" onClick={handleAddColumn}>
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8"
                    onClick={() => {
                      setShowAddColumn(false);
                      setAddingColumnTitle("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start border-dashed"
                onClick={() => setShowAddColumn(true)}
              >
                <Plus className="mr-2 size-4" />
                Add Column
              </Button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeCard ? <CardOverlay card={activeCard} /> : null}
        </DragOverlay>
      </DndContext>

      <KanbanCardForm
        open={cardFormOpen}
        onOpenChange={(open) => {
          setCardFormOpen(open);
          if (!open) {
            setEditingCard(null);
            setCardFormColId(null);
          }
        }}
        card={editingCard}
        onSubmit={handleCardFormSubmit}
      />

      <AlertDialog
        open={!!deletingCard}
        onOpenChange={(open) => !open && setDeletingCard(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete card?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deletingCard?.title}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCard}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingColId}
        onOpenChange={(open) => !open && setDeletingColId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete column?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this column and all its cards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteColumn}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
