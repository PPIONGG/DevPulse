"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-1">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-2.5 w-28 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  // ใช้ข้อมูลจาก profiles table ก่อน fallback ไป user_metadata
  const metadata = user.user_metadata;
  const displayName =
    profile?.display_name ||
    metadata?.full_name ||
    metadata?.user_name ||
    null;
  const avatarUrl = profile?.avatar_url || metadata?.avatar_url;
  const email = profile?.email || user.email;

  const initials = displayName
    ? displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email?.slice(0, 2).toUpperCase() ?? "?";

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    toast.success("Signed out successfully!");
    router.push("/auth/login");
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={avatarUrl} alt={displayName ?? email ?? "User"} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        {displayName && (
          <p className="truncate text-sm font-medium">{displayName}</p>
        )}
        {email && (
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={handleSignOut}
        disabled={signingOut}
      >
        {signingOut ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
        <span className="sr-only">Sign out</span>
      </Button>
    </div>
  );
}
