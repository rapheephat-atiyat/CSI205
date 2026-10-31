import type { Metadata } from "next";
import { QrCode } from "lucide-react";
import { StaffSidebarNav, StaffTabNav } from "@/components/staff/staff-nav";
import { eventInfo, staffProfile } from "@/lib/staff-mock";

export const metadata: Metadata = {
  title: "Staff & Check-in | TuaTua",
  description: "ระบบเจ้าหน้าที่หน้างานสำหรับเช็กอินและจัดการผู้เข้าร่วม",
};

export default function StaffLayout({ children }: LayoutProps<"/staff">) {
  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-4 lg:px-6 lg:py-6">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col rounded-2xl border bg-background p-4 lg:flex">
          <div className="mb-5 flex items-center gap-2.5 px-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-on-brand">
              <QrCode className="size-5" aria-hidden />
            </span>
            <div className="leading-tight">
              <p className="font-semibold">TuaTua</p>
              <p className="text-xs text-muted-foreground">Staff &amp; Check-in</p>
            </div>
          </div>
          <StaffSidebarNav />
          <div className="mt-auto rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">{staffProfile.name}</p>
            <p className="text-xs text-muted-foreground">{staffProfile.role}</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-on-brand">
                <QrCode className="size-4" aria-hidden />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold">{eventInfo.name}</p>
                <p className="text-xs text-muted-foreground">{staffProfile.role}</p>
              </div>
            </div>
          </div>
          <StaffTabNav />
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
