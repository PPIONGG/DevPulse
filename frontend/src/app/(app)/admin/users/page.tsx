"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { redirect } from "next/navigation";
import { useAdminUsers } from "@/hooks/use-admin-users";
import { Users, Search, Loader2, Trash2, Shield, ShieldOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UserManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const { users, loading, updateRole, toggleActive, deleteUser } = useAdminUsers();
  const [search, setSearch] = useState("");

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

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.display_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground">Manage user accounts, roles, and access.</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="outline">{users.length} users</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" /> All Users
          </CardTitle>
          <CardDescription>
            {users.filter(u => u.is_active).length} active, {users.filter(u => !u.is_active).length} inactive
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y border-t">
            {filteredUsers.map((u) => {
              const isSelf = u.id === user?.id;
              return (
                <div key={u.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarImage src={u.avatar_url ? `/uploads/${u.avatar_url}` : undefined} />
                      <AvatarFallback className="text-xs">
                        {(u.display_name || u.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{u.display_name || u.email}</span>
                        {isSelf && <Badge variant="outline" className="h-4 text-[10px]">You</Badge>}
                        {!u.is_active && <Badge variant="destructive" className="h-4 text-[10px]">Disabled</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-muted-foreground hidden sm:block">
                      {new Date(u.created_at).toLocaleDateString()}
                    </div>
                    <Select
                      value={u.role}
                      onValueChange={(role) => updateRole(u.id, role)}
                      disabled={isSelf}
                    >
                      <SelectTrigger className="h-8 w-[100px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user" className="text-xs">User</SelectItem>
                        <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{u.is_active ? "Active" : "Disabled"}</span>
                      <Switch
                        checked={u.is_active}
                        onCheckedChange={(checked) => toggleActive(u.id, checked)}
                        disabled={isSelf}
                      />
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 text-destructive" disabled={isSelf}>
                          <Trash2 className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete user?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete {u.email} and all associated data. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteUser(u.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">No users found.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
