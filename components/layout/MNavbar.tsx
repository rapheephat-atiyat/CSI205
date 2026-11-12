"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ChevronRight, LogOut, Menu, Ticket, User, X } from "lucide-react";
import Brand from "@/components/core/Brand";
import { Button } from "@/components/ui/button";
import {
    Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter,
    DrawerHeader, DrawerTitle, DrawerTrigger,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MobileNavigationProps {
    links: readonly { label: string; href: string }[];
    isActive: (href: string) => boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: { name: string; email: string; firstName?: string | null };
    isPending: boolean;
    isSigningOut: boolean;
    onSignOut: () => Promise<void>;
}

const accountLinks = [
    { href: "/profile", label: "โปรไฟล์ของฉัน", icon: User },
    { href: "/account/tickets", label: "บัตรของฉัน", icon: Ticket },
] as const;

export default function MobileNavigation({
    links, isActive, open, onOpenChange, user, isPending, isSigningOut, onSignOut,
}: MobileNavigationProps) {
    const displayName = user?.firstName || user?.name || "User";

    useEffect(() => {
        const desktop = window.matchMedia("(min-width: 64rem)");
        const closeOnDesktop = (event: MediaQueryListEvent) => {
            if (event.matches) onOpenChange(false);
        };
        desktop.addEventListener("change", closeOnDesktop);
        return () => desktop.removeEventListener("change", closeOnDesktop);
    }, [onOpenChange]);

    const linkClassName = (active: boolean) => cn(
        "flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transition-none",
        active ? "bg-brand-soft font-medium text-brand" : "text-foreground hover:bg-muted",
    );

    return (
        <Drawer direction="right" open={open} onOpenChange={onOpenChange} autoFocus>
            <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="เปิดเมนู" className="size-11 rounded-lg lg:hidden">
                    <Menu aria-hidden="true" className="size-5" strokeWidth={1.5} />
                </Button>
            </DrawerTrigger>
            <DrawerContent className="h-dvh max-h-dvh gap-0 overflow-hidden data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:max-w-sm data-[vaul-drawer-direction=right]:rounded-none motion-reduce:transition-none sm:data-[vaul-drawer-direction=right]:rounded-l-xl">
                <DrawerHeader className="min-h-(--navbar-height) shrink-0 flex-row items-center justify-between border-b border-border/60 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:px-5">
                    <Brand onClick={() => onOpenChange(false)} />
                    <DrawerTitle className="sr-only">เมนู TUATUA</DrawerTitle>
                    <DrawerDescription className="sr-only">เลือกหน้าที่ต้องการเข้าชมหรือจัดการบัญชีของคุณ</DrawerDescription>
                    <DrawerClose asChild>
                        <Button variant="ghost" size="icon" aria-label="ปิดเมนู" className="size-11 rounded-lg">
                            <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
                        </Button>
                    </DrawerClose>
                </DrawerHeader>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    <nav aria-label="เมนูหลักบนมือถือ" className="space-y-1 px-4 py-5">
                        {links.map((link) => (
                            <DrawerClose asChild key={link.href}>
                                <Link href={link.href} aria-current={isActive(link.href) ? "page" : undefined} className={linkClassName(isActive(link.href))}>
                                    <span className="min-w-0 flex-1">{link.label}</span>
                                    <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" strokeWidth={1.5} />
                                </Link>
                            </DrawerClose>
                        ))}
                    </nav>

                    {!isPending && user && (
                        <div className="mx-4 border-t border-border/60 py-5">
                            <div className="mb-4 flex min-w-0 items-center gap-3 px-3">
                                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-sm font-semibold text-brand">
                                    {displayName.trim().charAt(0).toUpperCase()}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{displayName}</p>
                                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                                </div>
                            </div>
                            <nav aria-label="บัญชีของฉัน" className="space-y-1">
                                {accountLinks.map(({ href, label, icon: Icon }) => (
                                    <DrawerClose asChild key={href}>
                                        <Link href={href} aria-current={isActive(href) ? "page" : undefined} className={linkClassName(isActive(href))}>
                                            <Icon aria-hidden="true" className="size-4" strokeWidth={1.5} />
                                            {label}
                                        </Link>
                                    </DrawerClose>
                                ))}
                            </nav>
                        </div>
                    )}
                </div>

                <DrawerFooter className="shrink-0 gap-2 border-t border-border/60 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
                    {isPending ? (
                        <div role="status" aria-label="กำลังโหลดบัญชี" className="space-y-2">
                            <Skeleton className="h-11 w-full rounded-lg" />
                            <Skeleton className="h-11 w-full rounded-lg" />
                        </div>
                    ) : user ? (
                        <Button variant="ghost" disabled={isSigningOut} onClick={onSignOut} className="min-h-11 justify-start gap-3 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive">
                            <LogOut aria-hidden="true" className="size-4" strokeWidth={1.5} />
                            {isSigningOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
                        </Button>
                    ) : (
                        <>
                            <DrawerClose asChild>
                                <Button asChild variant="brand" className="min-h-11">
                                    <Link href="/auth/register" prefetch={false}>เริ่มต้นใช้งาน</Link>
                                </Button>
                            </DrawerClose>
                            <DrawerClose asChild>
                                <Button asChild variant="outline" className="min-h-11">
                                    <Link href="/auth/login" prefetch={false}>เข้าสู่ระบบ</Link>
                                </Button>
                            </DrawerClose>
                        </>
                    )}
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
