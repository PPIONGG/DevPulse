"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { redirect } from "next/navigation";
import { useAdminChallenges } from "@/hooks/use-admin-challenges";
import { testChallenge } from "@/lib/services/admin";
import { toast } from "sonner";
import { Database, Loader2, Plus, Trash2, Pencil, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { SqlChallenge, SqlChallengeInput } from "@/lib/types/database";

const EMPTY_INPUT: SqlChallengeInput = {
  slug: "", title: "", difficulty: "easy", category: "select",
  description: "", table_schema: "", seed_data: "", solution_sql: "",
  hint: "", order_sensitive: false, sort_order: 0,
};

const difficultyColors: Record<string, string> = {
  easy: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
  medium: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400",
  hard: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400",
};

export default function ChallengesAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { challenges, loading, createChallenge, updateChallenge, deleteChallenge } = useAdminChallenges();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SqlChallengeInput>(EMPTY_INPUT);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!authLoading && user?.role !== "admin") {
    redirect("/dashboard");
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_INPUT, sort_order: challenges.length + 1 });
    setDialogOpen(true);
  };

  const openEdit = (c: SqlChallenge) => {
    setEditingId(c.id);
    setForm({
      slug: c.slug, title: c.title, difficulty: c.difficulty, category: c.category,
      description: c.description, table_schema: c.table_schema, seed_data: c.seed_data,
      solution_sql: "", hint: c.hint, order_sensitive: c.order_sensitive, sort_order: c.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.slug || !form.title) {
      toast.error("Slug and title are required");
      return;
    }
    setSaving(true);
    if (editingId) {
      await updateChallenge(editingId, form);
    } else {
      await createChallenge(form);
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const handleTest = async () => {
    if (!form.table_schema || !form.solution_sql) {
      toast.error("Table schema and solution SQL are required to test");
      return;
    }
    setTesting(true);
    try {
      const result = await testChallenge({
        table_schema: form.table_schema,
        seed_data: form.seed_data,
        solution_sql: form.solution_sql,
      });
      if (result.success) {
        toast.success(`Test passed! ${result.row_count} rows returned`);
      } else {
        toast.error(result.error || "Test failed");
      }
    } catch {
      toast.error("Test failed");
    }
    setTesting(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SQL Challenges</h2>
          <p className="text-muted-foreground">Create, edit, and manage SQL practice challenges.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" /> New Challenge
        </Button>
      </div>

      <Badge variant="outline">{challenges.length} challenges</Badge>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-5" /> All Challenges
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y border-t">
            {challenges.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{c.title}</span>
                    <Badge className={`h-4 text-[10px] ${difficultyColors[c.difficulty] || ""}`}>
                      {c.difficulty}
                    </Badge>
                    <Badge variant="outline" className="h-4 text-[10px]">{c.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.slug} &middot; #{c.sort_order}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(c)}>
                    <Pencil className="size-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 text-destructive">
                        <Trash2 className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete challenge?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete &quot;{c.title}&quot; and all associated submissions.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteChallenge(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            {challenges.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">No challenges yet.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Challenge" : "New Challenge"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="select-all-users" />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Select All Users" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="select">SELECT</SelectItem>
                    <SelectItem value="filtering">Filtering</SelectItem>
                    <SelectItem value="joins">JOINs</SelectItem>
                    <SelectItem value="aggregate">Aggregation</SelectItem>
                    <SelectItem value="subquery">Subqueries</SelectItem>
                    <SelectItem value="window">Window Functions</SelectItem>
                    <SelectItem value="cte">CTEs</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Table Schema (CREATE TABLE)</Label>
              <Textarea value={form.table_schema} onChange={(e) => setForm({ ...form, table_schema: e.target.value })} rows={4} className="font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label>Seed Data (INSERT)</Label>
              <Textarea value={form.seed_data} onChange={(e) => setForm({ ...form, seed_data: e.target.value })} rows={4} className="font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label>Solution SQL</Label>
              <Textarea value={form.solution_sql} onChange={(e) => setForm({ ...form, solution_sql: e.target.value })} rows={3} className="font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label>Hint</Label>
              <Input value={form.hint} onChange={(e) => setForm({ ...form, hint: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.order_sensitive} onCheckedChange={(v) => setForm({ ...form, order_sensitive: v })} />
              <Label>Order-sensitive results</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleTest} disabled={testing} className="gap-2">
              <Play className="size-4" /> {testing ? "Testing..." : "Test Solution"}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
