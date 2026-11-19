"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Ticket, User } from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

type AccountUser = {
  firstName?: string | null;
  name?: string | null;
  email?: string | null;
};

export function AdminAccountMenu({
  user,
  isPending,
}: {
  user?: AccountUser;
  isPending: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const displayName = user?.firstName || user?.name || "ADMIN";
  const initial = displayName.trim().charAt(0).toUpperCase();

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            const protectedPrefixes = [
              "/profile",
              "/account",
              "/admin",
              "/vendor",
              "/checkout",
            ];
            if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
              router.push("/");
            }
          },
        },
      });
    } finally {
      setIsSigningOut(false);
    }
  }

  if (isPending) {
    return <Skeleton className="h-11 w-32 rounded-md" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-11 gap-2.5 pr-3 pl-2 font-normal cursor-pointer"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-brand-soft text-xs font-semibold text-brand">
            {initial}
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
  );
}
