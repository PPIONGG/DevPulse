"use client";

import dynamic from "next/dynamic";

const MobileSidebar = dynamic(
  () =>
    import("@/components/layout/mobile-sidebar").then((m) => m.MobileSidebar),
  { ssr: false }
);

export function MobileSidebarWrapper() {
  return <MobileSidebar />;
}
