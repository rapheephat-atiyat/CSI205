import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import { requirePageUser } from "@/server/auth/page-user";
import SuperAdminTopbar from "@/components/admin/SuperAdminTopbar";
import OnlyOnPath from "@/components/admin/OnlyOnPath";

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
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser("/admin");
  const isAdmin = user.userRoles.some((r) => r.role === "ADMIN");

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={false}>
        <main className="bg-[#F5F5F5] w-full">
          <OnlyOnPath path="/admin">
            <SuperAdminTopbar
              showFaqLink={user.userRoles.some(
                (role) =>
                  role.role === "ADMIN" &&
                  role.eventId === null &&
                  role.storeId === null,
              )}
            />
          </OnlyOnPath>
          {children}
        </main>
      </SidebarProvider>
    </TooltipProvider>
  );
}
