"use client"
import { usePathname, useRouter } from "next/navigation";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, } from "@/components/ui/navigation-menu";
import Brand from "@/components/core/Brand";
import MobileNavigation from "@/components/layout/MNavbar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronDown, LogOut, ShoppingCart, Ticket, User } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface NavbarLink {
    label: string;
    href: string;
}

const NAVBARLINKS: readonly NavbarLink[] = [
    { label: "หน้าหลัก", href: "/" },
    { label: "งานทั้งหมด", href: "/events" },
    { label: "วิธีใช้งาน", href: "/how-it-works" },
    { label: "ช่วยเหลือ", href: "/help" },
]

export default function Navabr() {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();
    const [mobileOpen, setMobileOpen] = useState<boolean>(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

    const user = session?.user;
    const displayName = user?.firstName || user?.name || "User";
    const init = displayName.trim().charAt(0).toUpperCase();

    const handleSignOut = async () => {
        if (isSigningOut) return;
        setIsSigningOut(true);
        try {
            await authClient.signOut({
                fetchOptions: {
                    onSuccess: () => {
                        setMobileOpen(false);
                        const protectedPrefixes = ["/profile", "/my-tickets", "/admin", "/vendor", "/checkout"];
                        if (protectedPrefixes.some((p) => pathname.startsWith(p))) {
                            router.replace("/");
                        }
                    },
                },
            });
        } finally {
            setIsSigningOut(false);
        }
    }

    return (
        <header className="sticky top-0 z-49 h-(--navbar-height) w-full shrink-0 border-b border-border/50 bg-background/90 backdrop-blur-2xl">
            <div className="mx-auto flex size-full max-w-7xl items-center justify-between gap-3 px-4 sm:gap-5 sm:px-6 lg:gap-6 lg:px-10">
                <Brand priority className="justify-self-start" />

                <NavigationMenu viewport={false} className="hidden lg:flex">
                    <NavigationMenuList className="gap-4 xl:gap-8">
                        {NAVBARLINKS.map((link) => (
                            <NavigationMenuItem key={link.href}>
                                <NavigationMenuLink active={isActive(link.href)} asChild className="relative min-h-11 rounded-sm px-0 py-3 font-normal text-muted-foreground after:absolute after:inset-x-0 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-brand after:transition-transform after:duration-200 hover:bg-transparent hover:text-foreground focus:bg-transparent focus-visible:ring-brand/25 data-active:bg-transparent data-active:text-foreground data-active:after:scale-x-100 data-active:hover:bg-transparent data-active:focus:bg-transparent motion-reduce:after:transition-none">
                                    <Link href={link.href} aria-current={isActive(link.href) ? "page" : undefined} prefetch>
                                        {link.label}
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        ))}
                    </NavigationMenuList>
                </NavigationMenu>

                <div className="flex shrink-0 items-center gap-1 sm:gap-3">
                    <Button
                        size="icon"
                        aria-label="ตะกร้าสินค้า"
                        className="size-11 rounded-lg bg-brand-soft text-brand hover:bg-brand hover:text-on-brand"
                    >
                        <ShoppingCart aria-hidden="true" className="size-5" strokeWidth={1.75} />
                    </Button>
                    <div className="hidden items-center gap-2 lg:flex">
                        {isPending ? (
                            <Skeleton className="h-10 w-28 rounded-lg" />
                        ) : user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-11 gap-2.5 pr-3 pl-2 font-normal"
                                    >
                                        <span className="flex size-7 items-center justify-center rounded-md bg-brand-soft text-xs font-semibold text-brand">
                                            {init}
                                        </span>
                                        <span className="max-w-32 truncate text-sm">
                                            {displayName}
                                        </span>
                                        <ChevronDown className="size-4 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent className="w-56" align="end">
                                    <DropdownMenuLabel>
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {user.name}
                                        </p>
                                        <p className="truncate text-xs font-normal text-muted-foreground">
                                            {user.email}
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
                                            <Link href="/my-tickets">
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
                        ) : (
                            <>
                                <Button
                                    asChild
                                    variant="ghost"
                                    className="h-11 rounded-lg px-3 font-normal"
                                >
                                    <Link href="/auth/login" prefetch={false}>
                                        เข้าสู่ระบบ
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    variant="brand"
                                    className="h-11 rounded-lg px-4 font-normal"
                                >
                                    <Link href="/auth/register" prefetch={false}>
                                        เริ่มต้นใช้งาน
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>

                    <MobileNavigation
                        links={NAVBARLINKS}
                        isActive={isActive}
                        open={mobileOpen}
                        onOpenChange={setMobileOpen}
                        user={user}
                        isPending={isPending}
                        isSigningOut={isSigningOut}
                        onSignOut={handleSignOut}
                    />
                </div>
            </div>
        </header >
    );
}
