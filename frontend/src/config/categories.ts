export const workLogCategories = [
  { value: "feature", label: "Feature", color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950" },
  { value: "bugfix", label: "Bug Fix", color: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950" },
  { value: "learning", label: "Learning", color: "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-950" },
  { value: "meeting", label: "Meeting", color: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950" },
  { value: "other", label: "Other", color: "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-950" },
] as const;

export type CategoryValue = (typeof workLogCategories)[number]["value"];

export function getCategoryConfig(value: string) {
  return workLogCategories.find((c) => c.value === value) ?? workLogCategories[4];
}
