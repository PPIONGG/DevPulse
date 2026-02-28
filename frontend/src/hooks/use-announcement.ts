"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getAnnouncement } from "@/lib/services/system";
import type { AnnouncementBanner } from "@/lib/types/database";

export function useAnnouncement() {
  const [announcement, setAnnouncement] = useState<AnnouncementBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchAnnouncement = useCallback(async () => {
    try {
      const data = await getAnnouncement();
      if (mountedRef.current) setAnnouncement(data);
    } catch {
      // Silently fail — don't disrupt the UI for announcement fetch
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnnouncement(); }, [fetchAnnouncement]);

  return { announcement, loading, refetch: fetchAnnouncement };
}
