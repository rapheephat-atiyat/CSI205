"use client";

import Brand from "@/components/core/Brand";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { CircleHelp } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminAccountMenu } from "@/components/admin/AdminAccountMenu";

export default function SuperAdminTopbar({ showFaqLink = false }: { showFaqLink?: boolean }) {
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;
  const wasPending = useRef(isPending);

  useEffect(() => {
    if (wasPending.current && !isPending) {
      toast(`ยินดีต้อนรับ ${user?.name ?? user?.firstName ?? "ADMIN"}`, {
        position: "bottom-right",
      });
    }
    wasPending.current = isPending;
  }, [isPending]);

  return (
    <div className="p-4 px-7 w-full flex flex-wrap items-center justify-between gap-3 mx-auto min-h-10 bg-on-brand">
      <Brand />
      <div className="flex items-center gap-2">
        {showFaqLink && <Button asChild variant={pathname === "/admin/faq" ? "secondary" : "outline"} className="h-11 gap-2"><Link href="/admin/faq" aria-current={pathname === "/admin/faq" ? "page" : undefined}><CircleHelp aria-hidden="true" />FAQ</Link></Button>}
        <AdminAccountMenu user={user} isPending={isPending} />
      </div>
    </div>
  );
}
