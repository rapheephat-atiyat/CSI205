import type { Metadata } from "next";
import { Suspense } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import { StaffSidebarNav } from "@/components/staff/staff-nav";
import { eventInfo, staffProfile } from "@/lib/staff-mock";

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
          <SidebarInset className="bg-[#F5F5F5] min-h-screen">
            <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden sm:inline-flex">
                      <BreadcrumbLink href="/staff">Staff</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden sm:inline-flex" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{eventInfo.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{staffProfile.name}</span>
                <span className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">{staffProfile.role}</span>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </Suspense>
  );
}
