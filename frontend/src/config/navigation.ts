import {
  LayoutDashboard,
  BookOpen,
  Code2,
  ClipboardList,
  Settings,
  LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Knowledge Base",
    href: "/knowledge-base",
    icon: BookOpen,
  },
  {
    title: "Code Snippets",
    href: "/code-snippets",
    icon: Code2,
  },
  {
    title: "Work Log",
    href: "/work-log",
    icon: ClipboardList,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];
