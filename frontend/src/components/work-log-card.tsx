"use client";

import { MoreVertical, Pencil, Trash2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCategoryConfig } from "@/config/categories";
import type { WorkLog } from "@/lib/types/database";

interface WorkLogCardProps {
  workLog: WorkLog;
  onEdit?: (workLog: WorkLog) => void;
  onDelete?: (workLog: WorkLog) => void;
}

export function WorkLogCard({ workLog, onEdit, onDelete }: WorkLogCardProps) {
  const category = getCategoryConfig(workLog.category);

  return (
    <Card className="gap-0 py-0 overflow-hidden">
      <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Badge variant="outline" className="shrink-0 text-xs">
            {workLog.date}
          </Badge>
          <CardTitle className="truncate text-base">{workLog.title}</CardTitle>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Badge className={`text-xs border-0 ${category.color}`}>
            {category.label}
          </Badge>
          {workLog.hours_spent !== null && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {workLog.hours_spent}h
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(workLog)}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(workLog)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {workLog.content && (
        <CardContent className="px-4 pb-3 pt-0">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {workLog.content}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
