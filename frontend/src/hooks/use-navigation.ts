"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getVisibleNavigation } from "@/lib/services/navigation";
import type { NavigationItem } from "@/lib/types/database";
import { useAuth } from "@/providers/auth-provider";

export const NAV_UPDATED_EVENT = "navigation-updated";

export function useNavigation() {
  const { user } = useAuth();
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchNav = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getVisibleNavigation();
      if (mountedRef.current) setItems(data);
    } catch (err) {
      console.error("Failed to fetch navigation:", err);
      if (mountedRef.current) setError("Failed to load navigation");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNav();
  }, [fetchNav]);

  // Listen for navigation changes from admin page
  useEffect(() => {
    const handler = () => fetchNav();
    window.addEventListener(NAV_UPDATED_EVENT, handler);
    return () => {
      window.removeEventListener(NAV_UPDATED_EVENT, handler);
    };
  }, [fetchNav]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { items, loading, error, refetch: fetchNav };
}
