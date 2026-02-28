import {
  LayoutDashboard,
  Code2,
  Calculator,
  DollarSign,
  Target,
  Kanban,
  Timer,
  KeyRound,
  Braces,
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
    title: "Expenses",
    href: "/expenses",
    icon: DollarSign,
  },
  {
    title: "Habits",
    href: "/habits",
    icon: Target,
  },
  {
    title: "Kanban",
    href: "/kanban",
    icon: Kanban,
  },
  {
    title: "Pomodoro",
    href: "/pomodoro",
    icon: Timer,
  },
  {
    title: "Env Vault",
    href: "/env-vault",
    icon: KeyRound,
  },
  {
    title: "JSON Tools",
    href: "/json-tools",
    icon: Braces,
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
