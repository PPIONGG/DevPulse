export const httpMethods = [
  { value: "GET", color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
  { value: "POST", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
  { value: "PUT", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
  { value: "PATCH", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30" },
  { value: "DELETE", color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
  { value: "HEAD", color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-900/30" },
  { value: "OPTIONS", color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-900/30" },
] as const;

export const bodyTypes = [
  { value: "none", label: "None" },
  { value: "json", label: "JSON" },
  { value: "text", label: "Text" },
  { value: "xml", label: "XML" },
  { value: "form", label: "Form URL Encoded" },
] as const;

export function getMethodStyle(method: string) {
  return httpMethods.find((m) => m.value === method.toUpperCase()) ?? httpMethods[0];
}

export function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return "text-green-600 dark:text-green-400";
  if (status >= 300 && status < 400) return "text-blue-600 dark:text-blue-400";
  if (status >= 400 && status < 500) return "text-yellow-600 dark:text-yellow-400";
  if (status >= 500) return "text-red-600 dark:text-red-400";
  return "text-muted-foreground";
}

export function getStatusBg(status: number): string {
  if (status >= 200 && status < 300) return "bg-green-100 dark:bg-green-900/30";
  if (status >= 300 && status < 400) return "bg-blue-100 dark:bg-blue-900/30";
  if (status >= 400 && status < 500) return "bg-yellow-100 dark:bg-yellow-900/30";
  if (status >= 500) return "bg-red-100 dark:bg-red-900/30";
  return "bg-muted";
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
