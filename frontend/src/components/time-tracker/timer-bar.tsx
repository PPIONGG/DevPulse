"use client";

import { useState } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project, TimeEntry } from "@/lib/types/database";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface TimerBarProps {
  projects: Project[];
  runningEntry: TimeEntry | null;
  elapsed: number;
  onStart: (projectId: string, description: string) => Promise<void>;
  onStop: () => Promise<void>;
}

export function TimerBar({
  projects,
  runningEntry,
  elapsed,
  onStart,
  onStop,
}: TimerBarProps) {
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);

  const activeProjects = projects.filter((p) => !p.is_archived);

  const handleStart = async () => {
    if (!projectId) return;
    setStarting(true);
    try {
      await onStart(projectId, description);
      setDescription("");
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    setStopping(true);
    try {
      await onStop();
    } finally {
      setStopping(false);
    }
  };

  const runningProject = runningEntry
    ? projects.find((p) => p.id === runningEntry.project_id)
    : null;

  return (
    <div className="rounded-lg border bg-card p-4">
      {runningEntry ? (
        <div className="flex items-center gap-4">
          <div className="relative flex size-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-red-500" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-medium">
              {runningEntry.description || "No description"}
            </span>
            <span className="text-xs text-muted-foreground">
              {runningProject && (
                <span className="inline-flex items-center gap-1">
                  <span
                    className="inline-block size-2 rounded-full"
                    style={{ backgroundColor: runningProject.color }}
                  />
                  {runningProject.title}
                </span>
              )}
            </span>
          </div>
          <span className="font-mono text-lg font-semibold tabular-nums">
            {formatDuration(elapsed)}
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleStop}
            disabled={stopping}
          >
            <Square className="mr-1 size-3.5 fill-current" />
            Stop
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {activeProjects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.title}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="What are you working on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleStart();
            }}
          />
          <Button
            onClick={handleStart}
            disabled={!projectId || starting}
          >
            <Play className="mr-1 size-3.5 fill-current" />
            Start
          </Button>
        </div>
      )}
    </div>
  );
}
