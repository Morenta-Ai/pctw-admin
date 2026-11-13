import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { PortalSidebar } from "./_shell/portal-sidebar";
import { TopBar } from "./_shell/top-bar";

/**
 * The signed-in frame: navy sidebar, top bar, page. The frame itself is
 * static; the role-filtered nav and staff menu stream in behind their own
 * Suspense boundaries, and each page sits under loading.tsx.
 */
export default function PortalLayout({ children }: LayoutProps<"/">) {
  return (
    <SidebarProvider>
      <PortalSidebar />
      <SidebarInset className="min-w-0 bg-background">
        <TopBar />
        <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
