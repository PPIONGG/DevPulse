import { api } from "@/lib/api/client";
import type { NavigationItem } from "@/lib/types/database";

export async function getAdminNavigation(): Promise<NavigationItem[]> {
  return api.get<NavigationItem[]>("/api/admin/navigation");
}

export async function toggleNavigationVisibility(id: string, isHidden: boolean): Promise<void> {
  await api.patch(`/api/admin/navigation/${id}/toggle`, { is_hidden: isHidden });
}
