import { api } from "@/lib/api/client";
import type { NavigationItem } from "@/lib/types/database";

export async function getVisibleNavigation(): Promise<NavigationItem[]> {
  return api.get<NavigationItem[]>("/api/navigation");
}
