"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { getAdminUsers, updateUserRole, toggleUserActive, deleteUser } from "@/lib/services/admin";
import type { AdminUserView } from "@/lib/types/database";

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminUsers();
      if (mountedRef.current) setUsers(data);
    } catch {
      if (mountedRef.current) toast.error("Failed to load users");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleUpdateRole = async (id: string, role: string) => {
    try {
      await updateUserRole(id, role);
      if (mountedRef.current) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
        toast.success("Role updated");
      }
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await toggleUserActive(id, isActive);
      if (mountedRef.current) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: isActive } : u));
        toast.success(isActive ? "User activated" : "User deactivated");
      }
    } catch {
      toast.error("Failed to update user status");
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteUser(id);
      if (mountedRef.current) {
        setUsers(prev => prev.filter(u => u.id !== id));
        toast.success("User deleted");
      }
    } catch {
      toast.error("Failed to delete user");
    }
  };

  return {
    users,
    loading,
    refetch: fetchUsers,
    updateRole: handleUpdateRole,
    toggleActive: handleToggleActive,
    deleteUser: handleDeleteUser,
  };
}
