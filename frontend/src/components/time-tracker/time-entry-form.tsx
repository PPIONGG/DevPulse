"use client";

import { useState, useEffect, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project, TimeEntry, TimeEntryInput } from "@/lib/types/database";

interface TimeEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: TimeEntry | null;
  projects: Project[];
  onSubmit: (data: TimeEntryInput) => Promise<void>;
}

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function nowLocalDatetime(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function TimeEntryForm({
  open,
  onOpenChange,
  entry,
  projects,
  onSubmit,
}: TimeEntryFormProps) {
  const isEditing = !!entry;
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [durationStr, setDurationStr] = useState("");
  const [isBillable, setIsBillable] = useState(true);
  const [tagsStr, setTagsStr] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeProjects = projects.filter((p) => !p.is_archived);

  useEffect(() => {
    if (open) {
      if (entry) {
        setProjectId(entry.project_id);
        setDescription(entry.description);
        setStartTime(toLocalDatetime(entry.start_time));
        setEndTime(entry.end_time ? toLocalDatetime(entry.end_time) : "");
        setDurationStr(String(Math.round(entry.duration / 60)));
        setIsBillable(entry.is_billable);
        setTagsStr(entry.tags.join(", "));
      } else {
        setProjectId(activeProjects[0]?.id ?? "");
        setDescription("");
        setStartTime(nowLocalDatetime());
        setEndTime(nowLocalDatetime());
        setDurationStr("30");
        setIsBillable(true);
        setTagsStr("");
      }
      setError(null);
    }
  }, [open, entry, activeProjects]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!projectId || !startTime) return;

    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const durationMinutes = parseInt(durationStr) || 0;

    const input: TimeEntryInput = {
      project_id: projectId,
      description,
      start_time: new Date(startTime).toISOString(),
      end_time: endTime ? new Date(endTime).toISOString() : null,
      duration: durationMinutes * 60,
      is_billable: isBillable,
      tags,
    };

    setSaving(true);
    setError(null);
    try {
      await onSubmit(input);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save time entry");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Time Entry" : "New Time Entry"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="entry-description">Description</Label>
            <Input
              id="entry-description"
              placeholder="What did you work on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry-start">Start Time</Label>
              <Input
                id="entry-start"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-end">End Time</Label>
              <Input
                id="entry-end"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="entry-duration">Duration (minutes)</Label>
            <Input
              id="entry-duration"
              type="number"
              min="1"
              placeholder="30"
              value={durationStr}
              onChange={(e) => setDurationStr(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entry-tags">Tags (comma-separated)</Label>
            <Input
              id="entry-tags"
              placeholder="bug, feature, meeting"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="is-billable"
              checked={isBillable}
              onCheckedChange={(checked) => setIsBillable(checked === true)}
            />
            <Label htmlFor="is-billable" className="font-normal">
              Billable
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
