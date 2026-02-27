import {
  LayoutDashboard,
  Code2,
  Calculator,
  Settings,
  FolderOpen,
  Share2,
  LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  children?: NavItem[];
}

export const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Code Snippets",
    href: "/code-snippets",
    icon: Code2,
    children: [
      {
        title: "My Snippets",
        href: "/code-snippets/my-snippets",
        icon: FolderOpen,
      },
      {
        title: "Shared",
        href: "/code-snippets/shared",
        icon: Share2,
      },
    ],
  },
  {
    title: "Calculator",
    href: "/calculator",
    icon: Calculator,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];
