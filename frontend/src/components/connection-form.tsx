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
import { sslModes, connectionColors } from "@/config/database-explorer";
import type { DBConnection, DBConnectionInput } from "@/lib/types/database";

interface ConnectionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection?: DBConnection | null;
  onSubmit: (data: DBConnectionInput) => Promise<void>;
  onTestConnection: (data: DBConnectionInput) => Promise<unknown>;
}

const defaultValues: DBConnectionInput = {
  name: "",
  host: "localhost",
  port: 5432,
  database_name: "",
  username: "postgres",
  password: "",
  ssl_mode: "disable",
  is_read_only: false,
  color: "#6b7280",
};

export function ConnectionForm({
  open,
  onOpenChange,
  connection,
  onSubmit,
  onTestConnection,
}: ConnectionFormProps) {
  const isEditing = !!connection;
  const [form, setForm] = useState<DBConnectionInput>(defaultValues);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (connection) {
        setForm({
          name: connection.name,
          host: connection.host,
          port: connection.port,
          database_name: connection.database_name,
          username: connection.username,
          password: "",
          ssl_mode: connection.ssl_mode,
          is_read_only: connection.is_read_only,
          color: connection.color,
        });
      } else {
        setForm({ ...defaultValues });
      }
      setError(null);
      setTestResult(null);
    }
  }, [open, connection]);

  const handleOpenChange = (value: boolean) => {
    if (value) {
      if (connection) {
        setForm({
          name: connection.name,
          host: connection.host,
          port: connection.port,
          database_name: connection.database_name,
          username: connection.username,
          password: "",
          ssl_mode: connection.ssl_mode,
          is_read_only: connection.is_read_only,
          color: connection.color,
        });
      } else {
        setForm({ ...defaultValues });
      }
    }
    onOpenChange(value);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await onTestConnection(form);
      setTestResult({ ok: true, message: "Connection successful" });
    } catch (err) {
      setTestResult({
        ok: false,
        message: err instanceof Error ? err.message : "Connection failed",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.host.trim() || !form.database_name.trim() || !form.username.trim()) return;
    if (!isEditing && !form.password) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save connection");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Connection" : "New Connection"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="conn-name">Connection Name</Label>
            <Input
              id="conn-name"
              placeholder="e.g. Production DB"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="conn-host">Host</Label>
              <Input
                id="conn-host"
                placeholder="localhost"
                value={form.host}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, host: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conn-port">Port</Label>
              <Input
                id="conn-port"
                type="number"
                value={form.port}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, port: parseInt(e.target.value) || 5432 }))
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conn-database">Database Name</Label>
            <Input
              id="conn-database"
              placeholder="mydb"
              value={form.database_name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, database_name: e.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="conn-username">Username</Label>
              <Input
                id="conn-username"
                placeholder="postgres"
                value={form.username}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, username: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conn-password">
                Password{isEditing ? " (leave blank to keep)" : ""}
              </Label>
              <Input
                id="conn-password"
                type="password"
                placeholder={isEditing ? "unchanged" : "password"}
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                required={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conn-ssl">SSL Mode</Label>
            <Select
              value={form.ssl_mode}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, ssl_mode: value }))
              }
            >
              <SelectTrigger id="conn-ssl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sslModes.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {connectionColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`size-7 rounded-full transition-all ${
                    form.color === color
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setForm((prev) => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="conn-readonly"
              checked={form.is_read_only}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, is_read_only: checked === true }))
              }
            />
            <Label htmlFor="conn-readonly" className="text-sm font-normal">
              Read-only mode (only SELECT queries allowed)
            </Label>
          </div>

          {testResult && (
            <div
              className={`rounded-md px-3 py-2 text-sm ${
                testResult.ok
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {testResult.message}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={testing || !form.host || !form.database_name || !form.username || (!isEditing && !form.password)}
            >
              {testing ? "Testing..." : "Test Connection"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
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
