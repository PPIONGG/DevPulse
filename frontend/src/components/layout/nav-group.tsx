"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { NavItem as NavItemType } from "@/config/navigation";
import { NavItem } from "./nav-item";

interface NavGroupProps {
  item: NavItemType;
}

export function NavGroup({ item }: NavGroupProps) {
  const pathname = usePathname();
  const isChildActive = item.children?.some((child) =>
    pathname.startsWith(child.href)
  );

  return (
    <Collapsible defaultOpen={isChildActive}>
      <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground group">
        <item.icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{item.title}</span>
        <ChevronRight className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200",
          "group-data-[state=open]:rotate-90"
        )} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 space-y-1">
          {item.children?.map((child) => (
            <NavItem key={child.href} item={child} indent />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
