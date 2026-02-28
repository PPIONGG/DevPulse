import { api } from "@/lib/api/client";
import type {
  NavigationItem,
  AdminUserView,
  CodeSnippet,
  SqlChallenge,
  SqlChallengeInput,
  SystemStats,
  VaultAuditLog,
  SystemSetting,
  FeatureToggle,
  AnnouncementBanner,
} from "@/lib/types/database";

// Navigation
export async function getAdminNavigation(): Promise<NavigationItem[]> {
  return api.get<NavigationItem[]>("/api/admin/navigation");
}

export async function toggleNavigationVisibility(id: string, isHidden: boolean): Promise<void> {
  await api.patch(`/api/admin/navigation/${id}/toggle`, { is_hidden: isHidden });
}

export async function updateNavigationGroup(id: string, groupName: string): Promise<void> {
  await api.patch(`/api/admin/navigation/${id}/group`, { group_name: groupName });
}

export async function getNavigationGroups(): Promise<string[]> {
  return api.get<string[]>("/api/admin/navigation/groups");
}

// User Management
export async function getAdminUsers(): Promise<AdminUserView[]> {
  return api.get<AdminUserView[]>("/api/admin/users");
}

export async function updateUserRole(id: string, role: string): Promise<void> {
  await api.patch(`/api/admin/users/${id}/role`, { role });
}

export async function toggleUserActive(id: string, isActive: boolean): Promise<void> {
  await api.patch(`/api/admin/users/${id}/active`, { is_active: isActive });
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/api/admin/users/${id}`);
}

// Content Moderation — Snippets
export async function getAdminSnippets(): Promise<CodeSnippet[]> {
  return api.get<CodeSnippet[]>("/api/admin/snippets");
}

export async function verifySnippet(id: string, verified: boolean): Promise<void> {
  await api.patch(`/api/admin/snippets/${id}/verify`, { verified });
}

export async function deleteAdminSnippet(id: string): Promise<void> {
  await api.delete(`/api/admin/snippets/${id}`);
}

// Content Moderation — Challenges
export async function createChallenge(input: SqlChallengeInput): Promise<SqlChallenge> {
  return api.post<SqlChallenge>("/api/admin/challenges", input);
}

export async function updateChallenge(id: string, input: SqlChallengeInput): Promise<SqlChallenge> {
  return api.put<SqlChallenge>(`/api/admin/challenges/${id}`, input);
}

export async function deleteChallenge(id: string): Promise<void> {
  await api.delete(`/api/admin/challenges/${id}`);
}

export async function testChallenge(input: { table_schema: string; seed_data: string; solution_sql: string }): Promise<{
  success: boolean;
  error?: string;
  columns?: string[];
  rows?: unknown[][];
  row_count?: number;
}> {
  return api.post("/api/admin/challenges/test", input);
}

// Stats & Audit
export async function getSystemStats(): Promise<SystemStats> {
  return api.get<SystemStats>("/api/admin/stats");
}

export async function getAdminVaultAuditLogs(): Promise<VaultAuditLog[]> {
  return api.get<VaultAuditLog[]>("/api/admin/audit/vaults");
}

// System Settings & Features
export async function getSystemSettings(): Promise<SystemSetting[]> {
  return api.get<SystemSetting[]>("/api/admin/settings");
}

export async function updateSystemSetting(key: string, value: string): Promise<void> {
  await api.put("/api/admin/settings", { key, value });
}

export async function getAdminFeatureToggles(): Promise<FeatureToggle[]> {
  return api.get<FeatureToggle[]>("/api/admin/features");
}

export async function updateFeatureToggle(id: string, isEnabled: boolean, disabledMessage: string): Promise<void> {
  await api.patch(`/api/admin/features/${id}`, { is_enabled: isEnabled, disabled_message: disabledMessage });
}

export async function setAnnouncement(data: { enabled: boolean; message: string; type: string }): Promise<void> {
  await api.put("/api/admin/announcement", data);
}

export async function setMaintenanceMode(data: { enabled: boolean; message: string }): Promise<void> {
  await api.put("/api/admin/maintenance", data);
}
