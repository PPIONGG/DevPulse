import { api } from "@/lib/api/client";
import type {
  KanbanBoard,
  KanbanBoardInput,
  KanbanBoardFull,
  KanbanColumn,
  KanbanColumnInput,
  KanbanCard,
  KanbanCardInput,
} from "@/lib/types/database";

// --- Boards ---

export async function getBoards(): Promise<KanbanBoard[]> {
  return api.get<KanbanBoard[]>("/api/kanban/boards");
}

export async function getBoard(id: string): Promise<KanbanBoardFull> {
  return api.get<KanbanBoardFull>(`/api/kanban/boards/${id}`);
}

export async function createBoard(
  input: KanbanBoardInput
): Promise<KanbanBoard> {
  return api.post<KanbanBoard>("/api/kanban/boards", input);
}

export async function updateBoard(
  id: string,
  input: KanbanBoardInput
): Promise<KanbanBoard> {
  return api.put<KanbanBoard>(`/api/kanban/boards/${id}`, input);
}

export async function deleteBoard(id: string): Promise<void> {
  await api.delete(`/api/kanban/boards/${id}`);
}

// --- Columns ---

export async function createColumn(
  boardId: string,
  input: KanbanColumnInput
): Promise<KanbanColumn> {
  return api.post<KanbanColumn>(
    `/api/kanban/boards/${boardId}/columns`,
    input
  );
}

export async function updateColumn(
  colId: string,
  input: KanbanColumnInput
): Promise<KanbanColumn> {
  return api.put<KanbanColumn>(`/api/kanban/columns/${colId}`, input);
}

export async function deleteColumn(colId: string): Promise<void> {
  await api.delete(`/api/kanban/columns/${colId}`);
}

// --- Cards ---

export async function createCard(
  colId: string,
  input: KanbanCardInput
): Promise<KanbanCard> {
  return api.post<KanbanCard>(`/api/kanban/columns/${colId}/cards`, input);
}

export async function updateCard(
  cardId: string,
  input: KanbanCardInput
): Promise<KanbanCard> {
  return api.put<KanbanCard>(`/api/kanban/cards/${cardId}`, input);
}

export async function deleteCard(cardId: string): Promise<void> {
  await api.delete(`/api/kanban/cards/${cardId}`);
}

export async function reorderCards(
  updates: { id: string; column_id: string; position: number }[]
): Promise<void> {
  await api.put("/api/kanban/cards/reorder", updates);
}
