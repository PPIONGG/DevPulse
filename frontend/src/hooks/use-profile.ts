"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { updateProfile as updateProfileService } from "@/lib/services/profiles";
import { useAuth } from "@/providers/auth-provider";
import type { Profile } from "@/lib/types/database";

export function useProfile() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const updateProfile = useCallback(
    async (data: Partial<Pick<Profile, "display_name" | "avatar_url">>) => {
      if (!user) return;
      setUpdating(true);
      setError(null);
      try {
        await updateProfileService(supabase, user.id, data);
        await refreshProfile();
        if (mountedRef.current) toast.success("Profile updated");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update profile";
        if (mountedRef.current) setError(message);
        throw err;
      } finally {
        if (mountedRef.current) setUpdating(false);
      }
    },
    [user, supabase, refreshProfile]
  );

  return { profile, loading, updating, error, updateProfile };
}
