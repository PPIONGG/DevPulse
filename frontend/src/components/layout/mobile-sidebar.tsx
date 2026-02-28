"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  Menu, LayoutDashboard, Code2, DollarSign, Target, Kanban, Clock, ShieldCheck,
  Binary, Zap, History, Database, Workflow, ShoppingBag, SearchCode, Calculator,
  Settings, Lock, Users, FileCheck, BarChart3, Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavItem } from "./nav-item";
import { useNavigation } from "@/hooks/use-navigation";
import { useAuth } from "@/providers/auth-provider";
import { useTranslation } from "@/providers/language-provider";
import type { TranslationKey } from "@/lib/i18n";

const iconMap: Record<string, any> = {
  LayoutDashboard, Code2, DollarSign, Target, Kanban, Clock, ShieldCheck,
  Binary, Zap, History, Database, Workflow, ShoppingBag, SearchCode, Calculator, Settings,
};

const groupTranslationKey: Record<string, TranslationKey> = {
  Overview: "sidebar.overview",
  Development: "sidebar.development",
  Projects: "sidebar.projects",
  Lifestyle: "sidebar.lifestyle",
  System: "sidebar.system",
  Ungrouped: "sidebar.ungrouped",
};

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const { items } = useNavigation();
  const { t } = useTranslation();

  useEffect(() => { setOpen(false); }, [pathname]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof items> = {};
    for (const item of items) {
      const group = item.group_name || "Ungrouped";
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    }
    return groups;
  }, [items]);

  const groupOrder = ["Overview", "Development", "Projects", "Lifestyle", "System", "Ungrouped"];
  const sortedGroups = useMemo(() => {
    return Object.keys(groupedItems).sort((a, b) => {
      const ai = groupOrder.indexOf(a);
      const bi = groupOrder.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [groupedItems]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b h-14 justify-center px-4">
          <SheetTitle className="text-left font-bold">DevPulse</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-1 overflow-y-auto p-3">
          {sortedGroups.map((group) => (
            <div key={group}>
              {group !== "Overview" && (
                <div className="mt-4 px-3 mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                    {groupTranslationKey[group] ? t(groupTranslationKey[group]) : group}
                  </p>
                </div>
              )}
              {groupedItems[group].map((item) => (
                <NavItem
                  key={item.path}
                  item={{
                    title: item.label,
                    href: item.path,
                    icon: iconMap[item.icon] || Code2,
                  }}
                />
              ))}
            </div>
          ))}

          {user?.role === "admin" && (
            <>
              <div className="mt-6 px-3 mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                  <Lock className="size-2.5" /> {t("sidebar.adminPanel")}
                </p>
              </div>
              <NavItem item={{ title: t("admin.menuManager"), href: "/admin/navigation", icon: Settings }} />
              <NavItem item={{ title: t("admin.userManagement"), href: "/admin/users", icon: Users }} />
              <NavItem item={{ title: t("admin.snippetsMod"), href: "/admin/snippets", icon: FileCheck }} />
              <NavItem item={{ title: t("admin.sqlChallenges"), href: "/admin/challenges", icon: Database }} />
              <NavItem item={{ title: t("admin.systemStats"), href: "/admin/stats", icon: BarChart3 }} />
              <NavItem item={{ title: t("admin.settings"), href: "/admin/settings", icon: Wrench }} />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
