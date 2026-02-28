import { api } from "@/lib/api/client";
import type { AnnouncementBanner, FeatureToggle } from "@/lib/types/database";

export async function getAnnouncement(): Promise<AnnouncementBanner> {
  return api.get<AnnouncementBanner>("/api/system/announcement");
}

export async function getFeatureStatuses(): Promise<FeatureToggle[]> {
  return api.get<FeatureToggle[]>("/api/system/features");
}
