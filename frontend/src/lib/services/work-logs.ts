import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkLog, WorkLogInput } from "@/lib/types/database";

export async function getWorkLogs(
  supabase: SupabaseClient,
  userId: string
): Promise<WorkLog[]> {
  const { data, error } = await supabase
    .from("work_logs")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createWorkLog(
  supabase: SupabaseClient,
  userId: string,
  input: WorkLogInput
): Promise<WorkLog> {
  const { data, error } = await supabase
    .from("work_logs")
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateWorkLog(
  supabase: SupabaseClient,
  workLogId: string,
  input: Partial<WorkLogInput>
): Promise<WorkLog> {
  const { data, error } = await supabase
    .from("work_logs")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", workLogId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteWorkLog(
  supabase: SupabaseClient,
  workLogId: string
): Promise<void> {
  const { error } = await supabase
    .from("work_logs")
    .delete()
    .eq("id", workLogId);
  if (error) throw error;
}
