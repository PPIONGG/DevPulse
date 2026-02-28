"use client";

import { useState, useEffect, useCallback } from "react";
import { getVisibleNavigation } from "@/lib/services/navigation";
import type { NavigationItem } from "@/lib/types/database";
import { useAuth } from "@/providers/auth-provider";

export function useNavigation() {
  const { user } = useAuth();
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNav = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getVisibleNavigation();
      setItems(data);
    } catch (err) {
      console.error("Failed to fetch navigation:", err);
      setError("Failed to load navigation");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNav();
  }, [fetchNav]);

  return { items, loading, error, refetch: fetchNav };
}
