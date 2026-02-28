"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { getSystemStats } from "@/lib/services/admin";
import type { SystemStats } from "@/lib/types/database";

export function useAdminStats() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSystemStats();
      if (mountedRef.current) setStats(data);
    } catch {
      if (mountedRef.current) toast.error("Failed to load system stats");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
