"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";

const AUTH_TIMEOUT_MS = 10_000;

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isSigningOut } = useAuth();
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setTimedOut(true), AUTH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (isSigningOut) return;
    if ((!loading && !user) || (timedOut && !user)) {
      toast.error("Session expired. Please sign in again.");
      router.replace("/auth/login");
    }
  }, [loading, user, timedOut, isSigningOut, router]);

  if (loading && !timedOut) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
