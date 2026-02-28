"use client";

import { useAuth } from "@/providers/auth-provider";
import { useTranslation } from "@/providers/language-provider";
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
  const { t } = useTranslation();

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
        <h2 className="text-3xl font-bold tracking-tight">{t("adminSnippets.title")}</h2>
        <p className="text-muted-foreground">{t("adminSnippets.subtitle")}</p>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline">{snippets.length} {t("adminSnippets.publicSnippets")}</Badge>
        <Badge variant="outline" className="text-green-600">
          {snippets.filter(s => s.is_verified).length} {t("adminSnippets.verified")}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="size-5" /> {t("adminSnippets.allPublic")}
          </CardTitle>
          <CardDescription>{t("adminSnippets.allPublicDesc")}</CardDescription>
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
                        <CheckCircle className="size-2.5 mr-1" /> {t("adminSnippets.verified")}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="h-4 text-[10px] text-muted-foreground">
                        <XCircle className="size-2.5 mr-1" /> {t("adminSnippets.unverified")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("adminSnippets.by")} {snippet.owner_name || t("adminSnippets.unknown")} &middot; {snippet.tags?.join(", ") || t("adminSnippets.noTags")}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      {snippet.is_verified ? t("adminSnippets.verified") : t("adminSnippets.verify")}
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
                        <AlertDialogTitle>{t("adminSnippets.deleteTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("adminSnippets.deleteDesc")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteSnippet(snippet.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          {t("common.delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            {snippets.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">{t("adminSnippets.empty")}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
