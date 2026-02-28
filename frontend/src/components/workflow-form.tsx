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
import { triggerTypes } from "@/config/workflow-nodes";
import { useTranslation } from "@/providers/language-provider";
import type { Workflow, WorkflowInput } from "@/lib/types/database";

interface WorkflowFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow?: Workflow | null;
  onSubmit: (data: WorkflowInput) => Promise<void>;
}

const defaultValues: WorkflowInput = {
  title: "",
  description: "",
  is_enabled: false,
  trigger_type: "manual",
  cron_expression: "",
  nodes: [],
  edges: [],
};

export function WorkflowForm({
  open,
  onOpenChange,
  workflow,
  onSubmit,
}: WorkflowFormProps) {
  const { t } = useTranslation();
  const isEditing = !!workflow;
  const [form, setForm] = useState<WorkflowInput>({ ...defaultValues });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (workflow) {
        setForm({
          title: workflow.title,
          description: workflow.description,
          is_enabled: workflow.is_enabled,
          trigger_type: workflow.trigger_type,
          cron_expression: workflow.cron_expression,
          nodes: workflow.nodes,
          edges: workflow.edges,
        });
      } else {
        setForm({ ...defaultValues });
      }
      setError(null);
    }
  }, [open, workflow]);

  const handleOpenChange = (value: boolean) => {
    if (value) {
      if (workflow) {
        setForm({
          title: workflow.title,
          description: workflow.description,
          is_enabled: workflow.is_enabled,
          trigger_type: workflow.trigger_type,
          cron_expression: workflow.cron_expression,
          nodes: workflow.nodes,
          edges: workflow.edges,
        });
      } else {
        setForm({ ...defaultValues });
      }
    }
    onOpenChange(value);
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
      setError(err instanceof Error ? err.message : t("workflows.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("workflows.editTitle") : t("workflows.newTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="wf-title">{t("workflows.formTitle")}</Label>
            <Input
              id="wf-title"
              placeholder={t("workflows.formTitlePlaceholder")}
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wf-description">{t("workflows.formDescription")}</Label>
            <Textarea
              id="wf-description"
              placeholder={t("workflows.formDescPlaceholder")}
              className="min-h-[60px]"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wf-trigger">{t("workflows.formTriggerType")}</Label>
            <Select
              value={form.trigger_type}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, trigger_type: value }))
              }
            >
              <SelectTrigger id="wf-trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {triggerTypes.map((tr) => (
                  <SelectItem
                    key={tr.value}
                    value={tr.value}
                    disabled={tr.disabled}
                  >
                    {tr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {triggerTypes.find((tr) => tr.value === form.trigger_type)?.description}
            </p>
          </div>

          {form.trigger_type === "cron" && (
            <div className="space-y-2">
              <Label htmlFor="wf-cron">{t("workflows.formCronExpression")}</Label>
              <Input
                id="wf-cron"
                placeholder="*/5 * * * *"
                value={form.cron_expression}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, cron_expression: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                {t("workflows.cronHelp")}
              </p>
            </div>
          )}

          {isEditing && workflow?.trigger_type === "webhook" && workflow?.webhook_token && (
            <div className="space-y-2">
              <Label>{t("workflows.webhookUrl")}</Label>
              <Input
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/${workflow.webhook_token}`}
                className="text-xs font-mono"
                onClick={(e) => {
                  (e.target as HTMLInputElement).select();
                }}
              />
              <p className="text-xs text-muted-foreground">
                {t("workflows.webhookHelp")}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t("workflows.saving") : isEditing ? t("workflows.saveChanges") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
