export const sslModes = [
  { value: "disable", label: "Disable" },
  { value: "require", label: "Require" },
  { value: "verify-ca", label: "Verify CA" },
  { value: "verify-full", label: "Verify Full" },
  { value: "prefer", label: "Prefer" },
  { value: "allow", label: "Allow" },
] as const;

export const connectionColors = [
  "#6b7280", // gray
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
] as const;

export const dangerousQueryPatterns = [
  /^\s*DROP\s+/i,
  /^\s*TRUNCATE\s+/i,
  /^\s*DELETE\s+FROM\s+\S+\s*$/i,
  /^\s*ALTER\s+TABLE\s+.*DROP\s+/i,
  /^\s*DROP\s+DATABASE\s+/i,
] as const;

export function isDangerousQuery(query: string): boolean {
  return dangerousQueryPatterns.some((pattern) => pattern.test(query.trim()));
}
