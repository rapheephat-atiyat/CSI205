"use client"
import { usePathname } from "next/navigation";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, } from "@/components/ui/navigation-menu";
import Brand from "@/components/core/Brand";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";

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
    const [mobileOpen, setMobileOpen] = useState<boolean>(false);
    const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}`));

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
                    {/* รอทำโปรไฟล์ตอน login ตรงนี้อีกที Help */}
                    <Button asChild variant={"brand"} className="hidden h-11 rounded-lg px-3 font-normal lg:inline-flex">
                        <Link href={"/signup"} prefetch={false}>เริ่มต้นใช้งาน</Link>
                    </Button>

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