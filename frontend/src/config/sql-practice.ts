export const challengeDifficulties = [
  { value: "easy", label: "Easy", color: "bg-green-500", textColor: "text-green-700 dark:text-green-400" },
  { value: "medium", label: "Medium", color: "bg-yellow-500", textColor: "text-yellow-700 dark:text-yellow-400" },
  { value: "hard", label: "Hard", color: "bg-red-500", textColor: "text-red-700 dark:text-red-400" },
] as const;

export type ChallengeDifficulty = (typeof challengeDifficulties)[number]["value"];

export function getDifficultyConfig(value: string) {
  return challengeDifficulties.find((d) => d.value === value) ?? challengeDifficulties[0];
}

export const challengeCategories = [
  { value: "select", label: "SELECT Basics" },
  { value: "filtering", label: "WHERE & Filtering" },
  { value: "joins", label: "JOINs" },
  { value: "aggregate", label: "Aggregation" },
  { value: "subquery", label: "Subqueries" },
  { value: "window", label: "Window Functions" },
  { value: "cte", label: "CTEs" },
] as const;

export type ChallengeCategory = (typeof challengeCategories)[number]["value"];

export function getCategoryConfig(value: string) {
  return challengeCategories.find((c) => c.value === value) ?? challengeCategories[0];
}

export const submissionStatuses = [
  { value: "correct", label: "Correct", color: "text-green-600 dark:text-green-400" },
  { value: "wrong", label: "Wrong", color: "text-red-600 dark:text-red-400" },
  { value: "error", label: "Error", color: "text-orange-600 dark:text-orange-400" },
] as const;

export function getStatusConfig(value: string) {
  return submissionStatuses.find((s) => s.value === value) ?? submissionStatuses[2];
}
