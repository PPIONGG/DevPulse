export const cardPriorities = [
  { value: "low", label: "Low", color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950" },
  { value: "medium", label: "Medium", color: "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-950" },
  { value: "high", label: "High", color: "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-950" },
  { value: "urgent", label: "Urgent", color: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950" },
] as const;

export type CardPriority = (typeof cardPriorities)[number]["value"];

export function getPriorityConfig(value: string) {
  return cardPriorities.find((p) => p.value === value) ?? cardPriorities[1];
}

export const columnColors = [
  { value: "#6b7280", label: "Gray" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#10b981", label: "Green" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ef4444", label: "Red" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#06b6d4", label: "Cyan" },
] as const;
