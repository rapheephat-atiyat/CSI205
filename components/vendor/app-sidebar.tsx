'use client'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,


} from "@/components/ui/sidebar"
import Brand from "@/components/core/Brand";
import Link from "next/link";
import { LayoutGrid, Package, ScanLine } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";


export function AppSidebar() {

    const path = usePathname()
    const isActive = (h: string, exact = false) => exact ? path === h : path === h || path.startsWith(h + "/")
    return (
        <Sidebar>
            <SidebarHeader >
                <Brand />
            </SidebarHeader>
            <SidebarContent>
                < SidebarGroup>
                    <SidebarGroupLabel className="uppercase">
                        Vendor console
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            < SidebarMenuItem >
                                <SidebarMenuButton asChild className={isActive("/vendor", true) ? "hover:bg-brand bg-brand text-on-brand hover:text-on-brand " : "hover:border hover:border-brand-hover"}>
                                    <Link href="/vendor"><LayoutGrid />ภาพรวมร้านค้า</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            < SidebarMenuItem >
                                <SidebarMenuButton asChild className={isActive("/vendor/product") ? "hover:bg-brand bg-brand  text-on-brand hover:text-on-brand " : "hover:border hover:border-brand-hover"}>
                                    <Link href="/vendor/product"><Package />จัดการสินค้า</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            < SidebarMenuItem >
                                <SidebarMenuButton asChild className={isActive("/vendor/scan") ? "hover:bg-brand bg-brand  text-on-brand hover:text-on-brand " : "hover:border hover:border-brand-hover"}>
                                    <Link href="/vendor/scan"><ScanLine />แสกนจ่ายสินค้า</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}