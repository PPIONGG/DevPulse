"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { updateProfile as updateProfileService } from "@/lib/services/profiles";
import { useAuth } from "@/providers/auth-provider";
import type { Profile } from "@/lib/types/database";

export function useProfile() {
  const { user, profile, loading, refreshProfile } = useAuth();
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
    async (data: Partial<Pick<Profile, "display_name" | "avatar_url" | "preferred_language">>) => {
      if (!user) return;
      setUpdating(true);
      setError(null);
      try {
        await updateProfileService(data);
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
    [user, refreshProfile]
  );

  return { profile, loading, updating, error, updateProfile };
}
