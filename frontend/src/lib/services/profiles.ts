import { api } from "@/lib/api/client";
import type { Profile } from "@/lib/types/database";

export async function getProfile(): Promise<Profile | null> {
  return api.get<Profile>("/api/profile");
}

export async function updateProfile(
  data: Partial<Pick<Profile, "display_name" | "avatar_url">>
): Promise<void> {
  await api.put("/api/profile", data);
}
