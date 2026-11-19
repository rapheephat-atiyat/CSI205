"use client";

import { SidebarTrigger } from "../ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { AdminAccountMenu } from "@/components/admin/AdminAccountMenu";

function TopBar() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <div className="px-4 bg-on-brand w-full h-16 flex items-center justify-between">
      <SidebarTrigger />
      <AdminAccountMenu user={session?.user} isPending={isPending} />
    </div>
  );
}

export default TopBar;
