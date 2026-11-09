import { Suspense } from "react";
import AdminNav from "@/components/admin/AdminNav";
import TopBar from "@/components/admin/TopBar";

import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-dvh flex items-center justify-center py-4">
          <Spinner className="size-8 text-brand" />
        </div>
      }
    >
      <TooltipProvider>
        <SidebarProvider defaultOpen={false}>
          <AdminNav />
          <main className="bg-[#F5F5F5] w-full">
            <TopBar />
            {children}
          </main>
        </SidebarProvider>
      </TooltipProvider>
    </Suspense>
  );
}
