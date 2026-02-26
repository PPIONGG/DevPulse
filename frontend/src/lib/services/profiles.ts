import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types/database";
import { withTimeout } from "@/lib/utils/with-timeout";

export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data } = await withTimeout(
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url, email")
      .eq("id", userId)
      .single()
  );
  return data;
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  data: Partial<Pick<Profile, "display_name" | "avatar_url">>
): Promise<void> {
  const { error } = await withTimeout(
    supabase
      .from("profiles")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", userId)
  );
  if (error) throw error;
}
