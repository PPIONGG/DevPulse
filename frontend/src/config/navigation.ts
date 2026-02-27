import {
  LayoutDashboard,
  BookOpen,
  Code2,
  ClipboardList,
  Calculator,
  Settings,
  FileText,
  Bookmark,
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
    title: "Knowledge Base",
    href: "/knowledge-base",
    icon: BookOpen,
    children: [
      {
        title: "Articles",
        href: "/knowledge-base/articles",
        icon: FileText,
      },
      {
        title: "Bookmarks",
        href: "/knowledge-base/bookmarks",
        icon: Bookmark,
      },
    ],
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
    title: "Work Log",
    href: "/work-log",
    icon: ClipboardList,
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
