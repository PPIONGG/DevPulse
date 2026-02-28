"use client";

import { MoreVertical, Pencil, Trash2, Database, Lock } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DBConnection } from "@/lib/types/database";

interface ConnectionCardProps {
  connection: DBConnection;
  isActive: boolean;
  onSelect: (conn: DBConnection) => void;
  onEdit: (conn: DBConnection) => void;
  onDelete: (conn: DBConnection) => void;
}

export function ConnectionCard({
  connection,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}: ConnectionCardProps) {
  const lastConnected = connection.last_connected_at
    ? new Date(connection.last_connected_at).toLocaleDateString()
    : "Never";

  return (
    <Card
      className={`gap-0 cursor-pointer py-0 transition-colors hover:bg-muted/50 ${isActive ? "ring-2 ring-primary" : ""}`}
      onClick={() => onSelect(connection)}
    >
      <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: connection.color }}
          >
            <Database className="size-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="truncate text-base">
                {connection.name}
              </CardTitle>
              {connection.is_read_only && (
                <Badge variant="secondary" className="shrink-0 text-xs">
                  <Lock className="mr-1 size-3" />
                  Read-only
                </Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">
                {connection.host}:{connection.port}/{connection.database_name}
              </span>
              <span className="text-border">|</span>
              <span className="shrink-0">Last: {lastConnected}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(connection);
                }}
              >
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(connection);
                }}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
    </Card>
  );
}
