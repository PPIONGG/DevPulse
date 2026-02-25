"use client";

import { useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar as uploadAvatarService } from "@/lib/services/storage";
import { updateProfile } from "@/lib/services/profiles";
import { useAuth } from "@/providers/auth-provider";

export function useAvatarUpload() {
  const { user, refreshProfile } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAvatar = useCallback(
    async (blob: Blob): Promise<string | null> => {
      if (!user) return null;
      setUploading(true);
      setError(null);
      try {
        const freshUrl = await uploadAvatarService(supabase, user.id, blob);
        await updateProfile(supabase, user.id, { avatar_url: freshUrl });
        await refreshProfile();
        return freshUrl;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to upload avatar";
        setError(message);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [user, supabase, refreshProfile]
  );

  return { uploadAvatar, uploading, error };
}
