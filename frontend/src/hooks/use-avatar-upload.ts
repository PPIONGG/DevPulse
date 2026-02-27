"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { uploadAvatar as uploadAvatarService } from "@/lib/services/storage";
import { useAuth } from "@/providers/auth-provider";

export function useAvatarUpload() {
  const { user, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const uploadAvatar = useCallback(
    async (blob: Blob): Promise<string | null> => {
      if (!user) return null;
      setUploading(true);
      setError(null);
      try {
        const freshUrl = await uploadAvatarService(blob);
        await refreshProfile();
        if (mountedRef.current) toast.success("Avatar uploaded");
        return freshUrl;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to upload avatar";
        if (mountedRef.current) {
          setError(message);
          toast.error(message);
        }
        return null;
      } finally {
        if (mountedRef.current) setUploading(false);
      }
    },
    [user, refreshProfile]
  );

  return { uploadAvatar, uploading, error };
}
