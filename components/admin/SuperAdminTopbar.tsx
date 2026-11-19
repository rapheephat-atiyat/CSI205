"use client";

import Brand from "@/components/core/Brand";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { ChevronDown, CircleHelp, LogOut, Ticket, User } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function SuperAdminTopbar({ showFaqLink = false }: { showFaqLink?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const user = session?.user;
  const displayName = user?.firstName || user?.name || "ADMIN";
  const init = displayName.trim().charAt(0).toUpperCase();

  const wasPending = useRef(isPending);

  useEffect(() => {
    if (wasPending.current && !isPending) {
      toast(`ยินดีต้อนรับ ${user?.name ?? user?.firstName ?? "ADMIN"}`, {
        position: "bottom-right",
      });
    }
    wasPending.current = isPending;
  }, [isPending]);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            setMobileOpen(false);
            const protectedPrefixes = [
              "/profile",
              "/account",
              "/admin",
              "/vendor",
              "/checkout",
            ];
            if (protectedPrefixes.some((p) => pathname.startsWith(p))) {
              router.push("/");
            }
          },
        },
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="p-4 px-7 w-full flex flex-wrap items-center justify-between gap-3 mx-auto min-h-10 bg-on-brand">
      <Brand />
      <div className="flex items-center gap-2">
        {showFaqLink && <Button asChild variant={pathname === "/admin/faq" ? "secondary" : "outline"} className="h-11 gap-2"><Link href="/admin/faq" aria-current={pathname === "/admin/faq" ? "page" : undefined}><CircleHelp aria-hidden="true" />FAQ</Link></Button>}
        {isPending ? (
          <div className="flex w-fit items-center gap-4">
            <Skeleton className="size-11 w-32 round-md" />
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-11 gap-2.5 pr-3 pl-2 font-normal cursor-pointer"
              >
                <span className="flex size-7 items-center justify-center rounded-md bg-brand-soft text-xs font-semibold text-brand">
                  {init}
                </span>
                <span className="max-w-32 truncate text-sm">{displayName}</span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56 cursor-pointer" align="end">
              <DropdownMenuLabel>
                <p className="truncate text-sm font-medium text-foreground">
                  {user?.name}
                </p>
                <p className="truncate text-xs font-normal text-muted-foreground">
                  {user?.email}
                </p>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem asChild className="py-2 cursor-pointer">
                  <Link href="/profile">
                    <User />
                    โปรไฟล์ของฉัน
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="py-2 cursor-pointer">
                  <Link href="/account/tickets">
                    <Ticket />
                    บัตรของฉัน
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={isSigningOut}
                onClick={handleSignOut}
                className="py-2 cursor-pointer"
              >
                <LogOut />
                {isSigningOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
