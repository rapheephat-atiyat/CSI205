import { Suspense } from "react";
import AdminNav from "@/components/admin/AdminNav";
import TopBar from "@/components/admin/TopBar";

import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import { requirePageUser } from "@/server/auth/page-user";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageUser("ADMIN");
  const isAdmin = user.userRoles.some((r) => r.role === "ADMIN");
  if (!isAdmin) {
    return (
      <div className="w-full h-dvh flex flex-col items-center justify-center py-4 gap-3">
        <Lock className="size-8 text-muted-foreground" />
        <div className="text-lg text-muted-foreground font-semibold">
          คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้
        </div>
        <Badge
          variant="outline"
          className="p-3 mt-1 text-sm flex gap-1.5 items-center justify-center rounded-[10px] hover:cursor-pointer hover:border-brand hover:text-brand! ease-in-out"
        >
          <Link href="/">กลับสู้หน้าแรก</Link>
        </Badge>
      </div>
    );
  }
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
          {/* {pathname === "/newad" ? null : <AdminNav />} */}
          <main className="bg-[#F5F5F5] w-full">
            {/* <TopBar /> */}
            {children}
          </main>
        </SidebarProvider>
      </TooltipProvider>
    </Suspense>
  );
}
