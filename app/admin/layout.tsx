import AdminNav from "@/components/admin/admin-nav";
import TopBar from "@/components/admin/TopBar";

import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "radix-ui/tooltip";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AdminNav />
        <main className="bg-[#F5F5F5] w-full">
          <TopBar />
          {children}
        </main>
      </SidebarProvider>
    </TooltipProvider>
  );
}
