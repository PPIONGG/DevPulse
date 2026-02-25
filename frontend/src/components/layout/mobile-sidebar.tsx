"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { navigationItems } from "@/config/navigation";
import { NavItem } from "./nav-item";
import { NavGroup } from "./nav-group";
import { UserMenu } from "./user-menu";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="text-lg font-bold">DevPulse</SheetTitle>
        </SheetHeader>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" onClick={() => setOpen(false)}>
          {navigationItems.map((item) =>
            item.children ? (
              <NavGroup key={item.href} item={item} />
            ) : (
              <NavItem key={item.href} item={item} />
            )
          )}
        </nav>
        <Separator />
        <UserMenu />
      </SheetContent>
    </Sheet>
  );
}
