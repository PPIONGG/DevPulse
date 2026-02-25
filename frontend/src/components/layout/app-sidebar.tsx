"use client";

import { navigationItems } from "@/config/navigation";
import { NavItem } from "./nav-item";
import { UserMenu } from "./user-menu";
import { Separator } from "@/components/ui/separator";

export function AppSidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-sidebar">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-bold">DevPulse</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navigationItems.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
      </nav>
      <Separator />
      <UserMenu />
    </aside>
  );
}
