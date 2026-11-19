import { Suspense } from "react";
import AdminNav from "@/components/admin/AdminNav";
import TopBar from "@/components/admin/TopBar";

import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { requirePageUser } from "@/server/auth/page-user";
import { getDatabase } from "@/server/database/database.souce";
import { Events } from "@/server/database/entities";
import { hasPermission } from "@/server/auth/permission";
import { PERMISSIONS } from "@/lib/permissions";
import { AdminAccessProvider } from "@/components/admin/AdminAccess";

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-dvh flex items-center justify-center py-4">
          <Spinner className="size-8 text-brand" />
        </div>
      }
    >
      <AuthorizedEvent params={params}>{children}</AuthorizedEvent>
    </Suspense>
  );
}

async function AuthorizedEvent({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const user = await requirePageUser(`/admin/${encodeURIComponent(slug)}`);
  const event = await (await getDatabase()).getRepository(Events).findOne({ where: { slug }, select: { id: true, title: true, slug: true } });
  if (!event) notFound();
  if (!user.userRoles.some((role) => role.role === "ADMIN" && role.storeId === null && (role.eventId === null || role.eventId === event.id))) redirect("/admin");
  const permissions = Object.values(PERMISSIONS).filter((permission) => hasPermission(user, permission, { eventId: event.id }));
  return (
    <AdminAccessProvider eventId={event.id} eventTitle={event.title} slug={event.slug} userId={user.id} permissions={permissions}>
      <TooltipProvider>
        <SidebarProvider defaultOpen={false}>
          <AdminNav />
          <main className="bg-[#F5F5F5] w-full">
            <TopBar />
            {children}
          </main>
        </SidebarProvider>
      </TooltipProvider>
    </AdminAccessProvider>
  );
}
