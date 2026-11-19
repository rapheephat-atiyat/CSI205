import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import { requirePageUser } from "@/server/auth/page-user";
import SuperAdminTopbar from "@/components/admin/SuperAdminTopbar";

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageUser("ADMIN");
  const isAdmin = user.userRoles.some((r) => r.role === "ADMIN");

  if (!isAdmin) {
    redirect("/");
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
          <main className="bg-[#F5F5F5] w-full">
            <SuperAdminTopbar />
            {children}
          </main>
        </SidebarProvider>
      </TooltipProvider>
    </Suspense>
  );
}
