"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  AlertTriangle,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAdminNavigation, toggleNavigationVisibility, updateNavigationGroup } from "@/lib/services/admin";
import { NAV_UPDATED_EVENT } from "@/hooks/use-navigation";
import type { NavigationItem } from "@/lib/types/database";
import { useAuth } from "@/providers/auth-provider";
import { useTranslation } from "@/providers/language-provider";
import { redirect } from "next/navigation";

const GROUP_OPTIONS = ["Overview", "Development", "Projects", "Lifestyle", "System", "Ungrouped"] as const;

const GROUP_LABEL_KEYS: Record<string, string> = {
  Overview: "sidebar.overview",
  Development: "sidebar.development",
  Projects: "sidebar.projects",
  Lifestyle: "sidebar.lifestyle",
  System: "sidebar.system",
  Ungrouped: "sidebar.ungrouped",
};

export default function NavigationManagerPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchNav = async () => {
    try {
      setLoading(true);
      const data = await getAdminNavigation();
      setItems(data);
    } catch (err) {
      toast.error(t("adminNav.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (user?.role !== "admin") {
        redirect("/dashboard");
      }
      fetchNav();
    }
  }, [user, authLoading]);

  const handleToggleVisibility = async (id: string, currentHidden: boolean) => {
    try {
      setUpdatingId(id);
      await toggleNavigationVisibility(id, !currentHidden);
      setItems(items.map(item =>
        item.id === id ? { ...item, is_hidden: !currentHidden } : item
      ));
      window.dispatchEvent(new Event(NAV_UPDATED_EVENT));
      toast.success(t("adminNav.updated"));
    } catch (err) {
      toast.error(t("adminNav.updateFailed"));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleGroupChange = async (id: string, groupName: string) => {
    try {
      setUpdatingId(id);
      await updateNavigationGroup(id, groupName);
      setItems(items.map(item =>
        item.id === id ? { ...item, group_name: groupName } : item
      ));
      window.dispatchEvent(new Event(NAV_UPDATED_EVENT));
      toast.success(t("adminNav.groupUpdated"));
    } catch (err) {
      toast.error(t("adminNav.groupFailed"));
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t("adminNav.title")}</h2>
        <p className="text-muted-foreground">
          {t("adminNav.subtitle")}
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl">{t("adminNav.sidebarItems")}</CardTitle>
              <CardDescription>{t("adminNav.sidebarItemsDesc")}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchNav} className="h-8 gap-2">
              <RefreshCcw className="size-3" /> {t("common.refresh")}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y border-t">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Settings className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{item.label}</span>
                        {item.is_hidden && (
                          <Badge variant="secondary" className="h-4 text-[10px] uppercase">{t("adminNav.hidden")}</Badge>
                        )}
                        <Badge variant="outline" className="h-4 text-[10px] text-muted-foreground">{item.min_role}+</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.path}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Select
                      value={item.group_name}
                      onValueChange={(val) => handleGroupChange(item.id, val)}
                      disabled={updatingId === item.id}
                    >
                      <SelectTrigger className="h-8 w-[140px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GROUP_OPTIONS.map(g => (
                          <SelectItem key={g} value={g} className="text-xs">{t(GROUP_LABEL_KEYS[g] as any)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">
                        {item.is_hidden ? t("adminNav.hidden") : t("adminNav.visible")}
                      </span>
                      <Switch
                        checked={!item.is_hidden}
                        onCheckedChange={() => handleToggleVisibility(item.id, item.is_hidden)}
                        disabled={updatingId === item.id || item.path === "/dashboard"}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/30 dark:bg-yellow-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-200">{t("adminNav.adminNote")}</h4>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 leading-relaxed">
                {t("adminNav.adminNoteDesc")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
