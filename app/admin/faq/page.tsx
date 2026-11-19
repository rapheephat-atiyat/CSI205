import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import SuperAdminTopbar from "@/components/admin/SuperAdminTopbar";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePageUser } from "@/server/auth/page-user";
import { Role } from "@/server/database/enums/role.enum";
import FaqManager from "./FaqManager";

export const metadata: Metadata = { title: "จัดการ FAQ – TUATUA" };

export default function FaqPage() {
  return (
    <Suspense
      fallback={
        <div
          className="mx-auto max-w-7xl space-y-6 p-6"
          aria-busy="true"
          aria-label="กำลังโหลด FAQ"
        >
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <FaqContent />
    </Suspense>
  );
}

async function FaqContent() {
  const user = await requirePageUser("/admin/faq");
  const isAdmin = user.userRoles.some(
    (role) =>
      role.role === Role.ADMIN &&
      role.eventId === null &&
      role.storeId === null,
  );
  if (!isAdmin) redirect("/admin");

  return (
    <>
      <SuperAdminTopbar showFaqLink />
      <FaqManager />
    </>
  );
}
