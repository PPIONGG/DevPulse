"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  getBoards,
  getBoard,
  createBoard as createBoardService,
  updateBoard as updateBoardService,
  deleteBoard as deleteBoardService,
  createColumn as createColumnService,
  updateColumn as updateColumnService,
  deleteColumn as deleteColumnService,
  createCard as createCardService,
  updateCard as updateCardService,
  deleteCard as deleteCardService,
  reorderCards as reorderCardsService,
} from "@/lib/services/kanban";
import { useAuth } from "@/providers/auth-provider";
import type {
  KanbanBoard,
  KanbanBoardInput,
  KanbanBoardFull,
  KanbanColumnInput,
  KanbanCardInput,
  KanbanColumnWithCards,
} from "@/lib/types/database";

export function useKanban() {
  const { user, loading: authLoading } = useAuth();
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<KanbanBoardFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [boardLoading, setBoardLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchBoards = useCallback(async () => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getBoards();
      if (mountedRef.current) {
        setBoards(data);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch boards");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const selectBoard = useCallback(async (boardId: string | null) => {
    if (!boardId) {
      setSelectedBoard(null);
      return;
    }
    try {
      setBoardLoading(true);
      const data = await getBoard(boardId);
      if (mountedRef.current) {
        setSelectedBoard(data);
      }
    } catch (err) {
      if (mountedRef.current) {
        toast.error(err instanceof Error ? err.message : "Failed to load board");
      }
    } finally {
      if (mountedRef.current) setBoardLoading(false);
    }
  }, []);

  const refreshBoard = useCallback(async () => {
    if (!selectedBoard) return;
    try {
      const data = await getBoard(selectedBoard.id);
      if (mountedRef.current) {
        setSelectedBoard(data);
      }
    } catch {
      // Silently fail on refresh
    }
  }, [selectedBoard]);

  // --- Board CRUD ---

  const createBoard = useCallback(
    async (input: KanbanBoardInput) => {
      if (!user) return;
      const created = await createBoardService(input);
      if (mountedRef.current) {
        setBoards((prev) => [created, ...prev]);
        toast.success("Board created");
      }
      return created;
    },
    [user]
  );

  const updateBoard = useCallback(
    async (id: string, input: KanbanBoardInput) => {
      const updated = await updateBoardService(id, input);
      if (mountedRef.current) {
        setBoards((prev) => prev.map((b) => (b.id === id ? updated : b)));
        if (selectedBoard?.id === id) {
          setSelectedBoard((prev) =>
            prev ? { ...prev, ...updated } : null
          );
        }
        toast.success("Board updated");
      }
      return updated;
    },
    [selectedBoard]
  );

  const deleteBoard = useCallback(
    async (id: string) => {
      await deleteBoardService(id);
      if (mountedRef.current) {
        setBoards((prev) => prev.filter((b) => b.id !== id));
        if (selectedBoard?.id === id) {
          setSelectedBoard(null);
        }
        toast.success("Board deleted");
      }
    },
    [selectedBoard]
  );

  const toggleFavorite = useCallback(
    async (board: KanbanBoard) => {
      const newValue = !board.is_favorite;
      setBoards((prev) =>
        prev.map((b) =>
          b.id === board.id ? { ...b, is_favorite: newValue } : b
        )
      );
      try {
        await updateBoardService(board.id, {
          title: board.title,
          description: board.description,
          is_favorite: newValue,
        });
      } catch {
        if (mountedRef.current) {
          setBoards((prev) =>
            prev.map((b) =>
              b.id === board.id
                ? { ...b, is_favorite: board.is_favorite }
                : b
            )
          );
          toast.error("Failed to update favorite");
        }
      }
    },
    []
  );

  // --- Column CRUD ---

  const createColumn = useCallback(
    async (input: KanbanColumnInput) => {
      if (!selectedBoard) return;
      const created = await createColumnService(selectedBoard.id, input);
      if (mountedRef.current) {
        setSelectedBoard((prev) =>
          prev
            ? {
                ...prev,
                columns: [
                  ...prev.columns,
                  { ...created, cards: [] },
                ],
              }
            : null
        );
        toast.success("Column created");
      }
      return created;
    },
    [selectedBoard]
  );

  const updateColumn = useCallback(
    async (colId: string, input: KanbanColumnInput) => {
      const updated = await updateColumnService(colId, input);
      if (mountedRef.current) {
        setSelectedBoard((prev) =>
          prev
            ? {
                ...prev,
                columns: prev.columns.map((c) =>
                  c.id === colId ? { ...c, ...updated } : c
                ),
              }
            : null
        );
        toast.success("Column updated");
      }
      return updated;
    },
    []
  );

  const deleteColumn = useCallback(
    async (colId: string) => {
      await deleteColumnService(colId);
      if (mountedRef.current) {
        setSelectedBoard((prev) =>
          prev
            ? {
                ...prev,
                columns: prev.columns.filter((c) => c.id !== colId),
              }
            : null
        );
        toast.success("Column deleted");
      }
    },
    []
  );

  // --- Card CRUD ---

  const createCard = useCallback(
    async (colId: string, input: KanbanCardInput) => {
      const created = await createCardService(colId, input);
      if (mountedRef.current) {
        setSelectedBoard((prev) =>
          prev
            ? {
                ...prev,
                columns: prev.columns.map((c) =>
                  c.id === colId
                    ? { ...c, cards: [...c.cards, created] }
                    : c
                ),
              }
            : null
        );
        toast.success("Card created");
      }
      return created;
    },
    []
  );

  const updateCard = useCallback(
    async (cardId: string, input: KanbanCardInput) => {
      const updated = await updateCardService(cardId, input);
      if (mountedRef.current) {
        setSelectedBoard((prev) =>
          prev
            ? {
                ...prev,
                columns: prev.columns.map((c) => ({
                  ...c,
                  cards: c.cards.map((card) =>
                    card.id === cardId ? updated : card
                  ),
                })),
              }
            : null
        );
        toast.success("Card updated");
      }
      return updated;
    },
    []
  );

  const deleteCard = useCallback(
    async (cardId: string) => {
      await deleteCardService(cardId);
      if (mountedRef.current) {
        setSelectedBoard((prev) =>
          prev
            ? {
                ...prev,
                columns: prev.columns.map((c) => ({
                  ...c,
                  cards: c.cards.filter((card) => card.id !== cardId),
                })),
              }
            : null
        );
        toast.success("Card deleted");
      }
    },
    []
  );

  const moveCards = useCallback(
    async (newColumns: KanbanColumnWithCards[]) => {
      // Build update list
      const updates: { id: string; column_id: string; position: number }[] = [];
      for (const col of newColumns) {
        for (let i = 0; i < col.cards.length; i++) {
          const card = col.cards[i];
          if (card.column_id !== col.id || card.position !== i) {
            updates.push({ id: card.id, column_id: col.id, position: i });
          }
        }
      }

      // Optimistic update
      setSelectedBoard((prev) =>
        prev
          ? {
              ...prev,
              columns: newColumns.map((col) => ({
                ...col,
                cards: col.cards.map((card, i) => ({
                  ...card,
                  column_id: col.id,
                  position: i,
                })),
              })),
            }
          : null
      );

      if (updates.length > 0) {
        try {
          await reorderCardsService(updates);
        } catch {
          if (mountedRef.current) {
            toast.error("Failed to save card positions");
            refreshBoard();
          }
        }
      }
    },
    [refreshBoard]
  );

  return {
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
    refetch: fetchBoards,
  };
}
