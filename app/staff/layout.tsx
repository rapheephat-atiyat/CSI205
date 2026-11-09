import type { Metadata } from "next";
import { Suspense } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import { StaffSidebarNav } from "@/components/staff/staff-nav";
import { StaffTopBar } from "@/components/staff/top-bar";

export const metadata: Metadata = {
  title: "Staff & Check-in | TuaTua",
  description: "ระบบเจ้าหน้าที่หน้างานสำหรับเช็กอินและจัดการผู้เข้าร่วม",
};

export default function StaffLayout({
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
          <StaffSidebarNav />
          <main className="bg-[#F5F5F5] w-full min-h-screen flex flex-col">
            <StaffTopBar />
            <div className="w-full flex-1 p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </SidebarProvider>
      </TooltipProvider>
    </Suspense>
  );
}
