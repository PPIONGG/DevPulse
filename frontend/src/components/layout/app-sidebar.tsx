"use client";

import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { useNavigation } from "@/hooks/use-navigation";
import { NavItem } from "./nav-item";
import { UserMenu } from "./user-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LayoutDashboard, 
  Code2, 
  DollarSign, 
  Target, 
  Kanban, 
  Clock, 
  ShieldCheck, 
  Binary, 
  Zap, 
  History, 
  Database, 
  Workflow, 
  ShoppingBag, 
  SearchCode, 
  Calculator,
  Settings,
  Lock,
} from "lucide-react";

const iconMap: Record<string, any> = {
  LayoutDashboard,
  Code2,
  DollarSign,
  Target,
  Kanban,
  Clock,
  ShieldCheck,
  Binary,
  Zap,
  History,
  Database,
  Workflow,
  ShoppingBag,
  SearchCode,
  Calculator,
  Settings,
};

export function AppSidebar() {
  const { user } = useAuth();
  const { items, loading } = useNavigation();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-sidebar">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-bold">DevPulse</span>
      </div>
      
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <>
            {items.map((item) => (
              <NavItem 
                key={item.path} 
                item={{
                  title: item.label,
                  href: item.path,
                  icon: iconMap[item.icon] || Code2,
                }} 
              />
            ))}

            {/* Admin Section */}
            {user?.role === "admin" && (
              <>
                <div className="mt-6 px-3 mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                    <Lock className="size-2.5" /> Admin Panel
                  </p>
                </div>
                <NavItem 
                  item={{
                    title: "Menu Manager",
                    href: "/admin/navigation",
                    icon: Settings,
                  }} 
                />
              </>
            )}
          </>
        )}
      </nav>
      
      <Separator />
      <UserMenu />
    </aside>
  );
}
