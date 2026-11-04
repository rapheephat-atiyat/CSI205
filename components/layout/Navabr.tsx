"use client"
import { usePathname, useRouter } from "next/navigation";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, } from "@/components/ui/navigation-menu";
import Brand from "@/components/core/Brand";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronDown, LogOut, Menu, ShoppingCart, Ticket, User, X } from "lucide-react";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
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
    const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}`));

    const user = session?.user;
    const displayName = user?.firstName || user?.name || "User";
    const init = displayName.trim().charAt(0).toUpperCase();

    const hamdleSignOut = async () => {
        setIsSigningOut(true);
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    setMobileOpen(false)
                    router.refresh();
                },
                onError: () => {
                    setIsSigningOut(false);
                },
            }
        });
        setIsSigningOut(false);
    }

    return (
        <header className="sticky top-0 z-49 h-(--navbar-height) w-full border-b border-border/50 bg-background/90 backdrop-blur-2xl">
            <div className="mx-auto flex debug size-full max-w-7xl items-center justify-between gap-4 px-5 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-8 lg:px-10">
                <Brand priority className="justify-self-start" />

                <NavigationMenu viewport={false} className="hidden lg:flex">
                    <NavigationMenuList className="gap-6 xl:gap-8">
                        {NAVBARLINKS.map((link, i) => (
                            <NavigationMenuItem key={i}>
                                <NavigationMenuLink active={isActive(link.href)} asChild className="relative min-h-11 rounded-sm px-0 py-3 font-normal text-muted-foreground after:absolute after:inset-x-0 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-brand after:transition-transform after:duration-200 hover:bg-transparent hover:text-foreground focus:bg-transparent focus-visible:ring-brand/25 data-active:bg-transparent data-active:text-foreground data-active:after:scale-x-100 data-active:hover:bg-transparent data-active:focus:bg-transparent motion-reduce:after:transition-none">
                                    <Link href={link.href} prefetch>
                                        {link.label}
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        ))}
                    </NavigationMenuList>
                </NavigationMenu>

                <div className="flex shrink-0 items-center gap-2 justify-self-end sm:gap-3">
                    <Button
                        size="icon"
                        aria-label="ตะกร้าสินค้า"
                        className="size-10 rounded-lg bg-brand-soft text-brand hover:bg-brand hover:text-white"
                    >
                        <ShoppingCart className="size-5" strokeWidth={1.75} />
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
                                        onClick={hamdleSignOut}
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

                    <Drawer direction="right" open={mobileOpen} onOpenChange={setMobileOpen}>
                        <DrawerTrigger asChild>
                            <Button variant={"ghost"} size={"icon"} className="size-11 rounded-lg lg:hidden">
                                <Menu aria-hidden="true" className="size-5" strokeWidth={1.5} />
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent className="h-dvh gap-0 data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:max-w-sm">
                            <DrawerHeader className="h-18 shrink-0 flex-row items-center justify-between border-b px-5 py-3">
                                <Brand onClick={() => setMobileOpen(false)} />

                                <DrawerClose asChild>
                                    <Button
                                        variant={"ghost"}
                                        size="icon"
                                        aria-label="ปิดเมนู"
                                        className="size-11 rounded-lg"
                                    >
                                        <X
                                            aria-hidden="true"
                                            className="size-5"
                                            strokeWidth={1.5}
                                        />
                                    </Button>
                                </DrawerClose>
                            </DrawerHeader>

                            <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-5">
                                {NAVBARLINKS.map((link) => (
                                    <DrawerClose asChild key={link.href}>
                                        <Link
                                            href={link.href}
                                            aria-current={
                                                isActive(link.href) ? "page" : undefined
                                            }
                                            className={`flex min-h-12 shrink-0 items-center rounded-lg px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand ${isActive(link.href)
                                                ? "bg-brand-soft text-brand"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                }`}
                                        >
                                            {link.label}
                                        </Link>
                                    </DrawerClose>
                                ))}
                            </nav>
                            <DrawerFooter className="shrink-0 border-t px-5 py-6">
                                <DrawerClose asChild>
                                    <Button
                                        asChild
                                        variant="brand"
                                        className="h-11 rounded-lg"
                                    >
                                        <Link href="/signup">
                                            เริ่มต้นใช้งาน
                                        </Link>
                                    </Button>
                                </DrawerClose>
                            </DrawerFooter>
                        </DrawerContent>
                    </Drawer>
                </div>
            </div>
        </header >
    );
}