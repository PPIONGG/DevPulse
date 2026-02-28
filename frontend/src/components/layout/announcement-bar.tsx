"use client";

import { useAnnouncement } from "@/hooks/use-announcement";
import { Info, AlertTriangle, XCircle, CheckCircle } from "lucide-react";

const typeConfig = {
  info: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-800 dark:text-blue-200", border: "border-blue-200 dark:border-blue-900/30", Icon: Info },
  warning: { bg: "bg-yellow-50 dark:bg-yellow-950/30", text: "text-yellow-800 dark:text-yellow-200", border: "border-yellow-200 dark:border-yellow-900/30", Icon: AlertTriangle },
  error: { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-800 dark:text-red-200", border: "border-red-200 dark:border-red-900/30", Icon: XCircle },
  success: { bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-800 dark:text-green-200", border: "border-green-200 dark:border-green-900/30", Icon: CheckCircle },
};

export function AnnouncementBar() {
  const { announcement } = useAnnouncement();

  if (!announcement?.enabled || !announcement.message) return null;

  const config = typeConfig[announcement.type] || typeConfig.info;
  const { Icon } = config;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 text-sm border-b ${config.bg} ${config.text} ${config.border}`}>
      <Icon className="size-4 shrink-0" />
      <span>{announcement.message}</span>
    </div>
  );
}
