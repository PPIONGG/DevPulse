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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Client, Project, ProjectInput } from "@/lib/types/database";

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  clients: Client[];
  onSubmit: (data: ProjectInput) => Promise<void>;
}

const projectColors = [
  "#6b7280", "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#6366f1", "#a855f7", "#ec4899",
];

const defaultValues: ProjectInput = {
  client_id: null,
  title: "",
  description: "",
  color: "#6b7280",
  hourly_rate: null,
  budget_hours: null,
};

export function ProjectForm({
  open,
  onOpenChange,
  project,
  clients,
  onSubmit,
}: ProjectFormProps) {
  const isEditing = !!project;
  const [form, setForm] = useState<ProjectInput>(defaultValues);
  const [rateStr, setRateStr] = useState("");
  const [budgetStr, setBudgetStr] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (project) {
        setForm({
          client_id: project.client_id,
          title: project.title,
          description: project.description,
          color: project.color,
          hourly_rate: project.hourly_rate,
          budget_hours: project.budget_hours,
        });
        setRateStr(project.hourly_rate != null ? String(project.hourly_rate) : "");
        setBudgetStr(project.budget_hours != null ? String(project.budget_hours) : "");
      } else {
        setForm(defaultValues);
        setRateStr("");
        setBudgetStr("");
      }
      setError(null);
    }
  }, [open, project]);

  const handleNumberChange = (
    value: string,
    setStr: (v: string) => void,
    field: "hourly_rate" | "budget_hours"
  ) => {
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setStr(value);
      const num = parseFloat(value);
      setForm((prev) => ({ ...prev, [field]: value === "" ? null : isNaN(num) ? null : num }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Project" : "New Project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="project-title">Title</Label>
            <Input
              id="project-title"
              placeholder="Project title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              placeholder="Optional description"
              className="min-h-[60px]"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {projectColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`size-7 rounded-full border-2 transition-all ${
                    form.color === color ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setForm((prev) => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Client</Label>
            <Select
              value={form.client_id ?? "none"}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, client_id: v === "none" ? null : v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="No client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No client</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-rate">Hourly Rate</Label>
              <Input
                id="project-rate"
                type="text"
                inputMode="decimal"
                placeholder="Inherits from client"
                value={rateStr}
                onChange={(e) => handleNumberChange(e.target.value, setRateStr, "hourly_rate")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-budget">Budget Hours</Label>
              <Input
                id="project-budget"
                type="text"
                inputMode="decimal"
                placeholder="No budget"
                value={budgetStr}
                onChange={(e) => handleNumberChange(e.target.value, setBudgetStr, "budget_hours")}
              />
            </div>
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
