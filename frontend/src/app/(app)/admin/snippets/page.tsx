"use client";

import { useAuth } from "@/providers/auth-provider";
import { redirect } from "next/navigation";
import { useAdminSnippets } from "@/hooks/use-admin-snippets";
import { FileCheck, Loader2, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function SnippetsModerationPage() {
  const { user, loading: authLoading } = useAuth();
  const { snippets, loading, verify, deleteSnippet } = useAdminSnippets();

  if (!authLoading && user?.role !== "admin") {
    redirect("/dashboard");
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Snippets Moderation</h2>
        <p className="text-muted-foreground">Review and verify public code snippets.</p>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline">{snippets.length} public snippets</Badge>
        <Badge variant="outline" className="text-green-600">
          {snippets.filter(s => s.is_verified).length} verified
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="size-5" /> Public Snippets
          </CardTitle>
          <CardDescription>Verify snippets to mark them as reviewed and safe.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y border-t">
            {snippets.map((snippet) => (
              <div key={snippet.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{snippet.title}</span>
                    <Badge variant="secondary" className="h-4 text-[10px]">{snippet.language}</Badge>
                    {snippet.is_verified ? (
                      <Badge className="h-4 text-[10px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle className="size-2.5 mr-1" /> Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="h-4 text-[10px] text-muted-foreground">
                        <XCircle className="size-2.5 mr-1" /> Unverified
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    by {snippet.owner_name || "Unknown"} &middot; {snippet.tags?.join(", ") || "no tags"}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      {snippet.is_verified ? "Verified" : "Verify"}
                    </span>
                    <Switch
                      checked={snippet.is_verified}
                      onCheckedChange={(checked) => verify(snippet.id, checked)}
                    />
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 text-destructive">
                        <Trash2 className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete snippet?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete &quot;{snippet.title}&quot;. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteSnippet(snippet.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            {snippets.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">No public snippets to moderate.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
