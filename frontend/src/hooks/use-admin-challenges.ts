"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { createChallenge, updateChallenge, deleteChallenge } from "@/lib/services/admin";
import { api } from "@/lib/api/client";
import type { SqlChallenge, SqlChallengeInput } from "@/lib/types/database";

export function useAdminChallenges() {
  const [challenges, setChallenges] = useState<SqlChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<SqlChallenge[]>("/api/sql-practice/challenges");
      if (mountedRef.current) setChallenges(data);
    } catch {
      if (mountedRef.current) toast.error("Failed to load challenges");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChallenges(); }, [fetchChallenges]);

  const handleCreate = async (input: SqlChallengeInput) => {
    try {
      const challenge = await createChallenge(input);
      if (mountedRef.current) {
        setChallenges(prev => [...prev, challenge]);
        toast.success("Challenge created");
      }
      return challenge;
    } catch {
      toast.error("Failed to create challenge");
      return null;
    }
  };

  const handleUpdate = async (id: string, input: SqlChallengeInput) => {
    try {
      const challenge = await updateChallenge(id, input);
      if (mountedRef.current) {
        setChallenges(prev => prev.map(c => c.id === id ? challenge : c));
        toast.success("Challenge updated");
      }
      return challenge;
    } catch {
      toast.error("Failed to update challenge");
      return null;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteChallenge(id);
      if (mountedRef.current) {
        setChallenges(prev => prev.filter(c => c.id !== id));
        toast.success("Challenge deleted");
      }
    } catch {
      toast.error("Failed to delete challenge");
    }
  };

  return {
    challenges,
    loading,
    refetch: fetchChallenges,
    createChallenge: handleCreate,
    updateChallenge: handleUpdate,
    deleteChallenge: handleDelete,
  };
}
