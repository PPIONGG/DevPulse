import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileSidebarWrapper } from "@/components/layout/mobile-sidebar-wrapper";
import { AuthGuard } from "@/components/layout/auth-guard";
import { AnnouncementBar } from "@/components/layout/announcement-bar";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AnnouncementBar />
          <header className="flex h-14 items-center gap-4 border-b px-4 md:px-6">
            <MobileSidebarWrapper />
            <h1 className="text-lg font-semibold md:hidden">DevPulse</h1>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <AuthGuard>{children}</AuthGuard>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
