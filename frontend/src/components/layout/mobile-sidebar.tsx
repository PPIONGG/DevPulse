"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, LayoutDashboard, Code2, DollarSign, Target, Kanban, Clock, ShieldCheck, Binary, Zap, History, Database, Workflow, ShoppingBag, SearchCode, Calculator, Settings, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavItem } from "./nav-item";
import { useNavigation } from "@/hooks/use-navigation";
import { useAuth } from "@/providers/auth-provider";

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

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const { items } = useNavigation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
        </div>
      </SheetContent>
    </Sheet>
  );
}
