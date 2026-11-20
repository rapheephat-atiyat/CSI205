import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import SuperAdminTopbar from "@/components/admin/SuperAdminTopbar";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePageUser } from "@/server/auth/page-user";
import { Role } from "@/server/database/enums/role.enum";
import { getTokenRate } from "@/server/services/token-pricing.service";
import TokenRateForm from "./TokenRateForm";

export const metadata = { title: "ตั้งค่า Token – TUATUA" };

export default function AdminTokenPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-6 sm:px-6"><Skeleton className="h-56 w-full" aria-label="กำลังโหลดการตั้งค่า Token" /></div>}>
      <AdminTokenContent />
    </Suspense>
  );
}

async function AdminTokenContent() {
  await connection();
  const user = await requirePageUser("/admin/token");
  if (!user.userRoles.some((role) => role.role === Role.ADMIN && role.eventId === null && role.storeId === null)) {
    redirect("/admin");
  }

  const rate = await getTokenRate();
  return (
    <>
      <SuperAdminTopbar showGlobalLinks />
      <section className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">ตั้งค่า Token</h1>
        <TokenRateForm rate={rate} />
      </section>
    </>
  );
}
