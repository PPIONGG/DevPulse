"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { NavItem as NavItemType } from "@/config/navigation";

interface NavItemProps {
  item: NavItemType;
  collapsed?: boolean;
  indent?: boolean;
}

export function NavItem({ item, collapsed, indent }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  const linkContent = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground",
        indent && "pl-9"
      )}
    >
      <item.icon className={cn("shrink-0", indent ? "h-3.5 w-3.5" : "h-4 w-4")} />
      {!collapsed && <span>{item.title}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right">{item.title}</TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}
