import type { SupabaseClient } from "@supabase/supabase-js";
import { withTimeout } from "@/lib/utils/with-timeout";

export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  blob: Blob
): Promise<string> {
  const filePath = `${userId}/avatar.jpg`;

  const { error: uploadError } = await withTimeout(
    supabase.storage
      .from("avatars")
      .upload(filePath, blob, { upsert: true, contentType: "image/jpeg" }),
    30_000
  );

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  return `${publicUrl}?t=${Date.now()}`;
}
