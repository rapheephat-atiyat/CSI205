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
import { ArrowLeftRight, LayoutGrid, Package, ScanLine, Store } from "lucide-react";
import { usePathname } from "next/navigation";
import { useVendorStore } from "./vendor-store-context";

export function AppSidebar() {
    const path = usePathname()
    const { selectedStore, clearStore } = useVendorStore()
    const isActive = (h: string, exact = false) => exact ? path === h : path === h || path.startsWith(h + "/")

    return (
        <Sidebar>
            <SidebarHeader>
                <Brand />
                {selectedStore && (
                    <div className="mt-2 mx-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Store className="size-3.5 text-brand shrink-0" />
                            <span>ร้านที่ปฏิบัติงาน</span>
                        </div>
                        <div className="font-bold text-sm text-slate-900 truncate mt-0.5">
                            {selectedStore.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                            รหัส {selectedStore.code}
                        </div>
                    </div>
                )}
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="uppercase">
                        Vendor console
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className={isActive("/vendor", true) ? "hover:bg-brand bg-brand text-on-brand hover:text-on-brand " : "hover:border hover:border-brand-hover"}>
                                    <Link href="/vendor"><LayoutGrid />ภาพรวมร้านค้า</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className={isActive("/vendor/product") ? "hover:bg-brand bg-brand  text-on-brand hover:text-on-brand " : "hover:border hover:border-brand-hover"}>
                                    <Link href="/vendor/product"><Package />รายละเอียดร้านค้า</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className={isActive("/vendor/scan") ? "hover:bg-brand bg-brand  text-on-brand hover:text-on-brand " : "hover:border hover:border-brand-hover"}>
                                    <Link href="/vendor/scan"><ScanLine />แสกนจ่ายสินค้า</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-3 border-t border-slate-100">
                <button
                    onClick={clearStore}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                    <ArrowLeftRight className="size-3.5" />
                    เปลี่ยนร้านค้า
                </button>
            </SidebarFooter>
        </Sidebar>
    )
}