import { api } from "@/lib/api/client";
import type { Profile } from "@/lib/types/database";

export async function uploadAvatar(blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("avatar", blob, "avatar.jpg");

  const profile = await api.upload<Profile>("/api/profile/avatar", formData);
  return profile.avatar_url ?? "";
}
