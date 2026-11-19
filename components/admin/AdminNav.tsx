"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";
import { useParams } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  CalendarDays,
  FileText,
  History,
  LayoutDashboard,
  LucideIcon,
  Store,
  TicketPercent,
  Users,
} from "lucide-react";
import { cn } from "cn";
import Brand from "@/components/core/Brand";
import { useEffect } from "react";
import { ClipboardCheck } from "lucide-react";
import { useAdminAccess } from "./AdminAccess";
import { PERMISSIONS, type Permission } from "@/lib/permissions";

type NavItem = {
  icon: LucideIcon;
  href: string;
  label: string;
  permission?: Permission;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

export default function AdminNav() {
  const { can } = useAdminAccess();
  const { setOpen, state, setOpenMobile } = useSidebar();
  const { slug } = useParams<{ slug: string }>();
  const pathname = usePathname();
  const groups = getNavGroups(slug);

  const sidebarState = state === "expanded";

  function getNavGroups(slug: string): NavGroup[] {
    const base = `/admin/${slug}`;
    return [
      {
        label: "พื้นที่ผู้ดูแลส่วนกลาง",
        items: [
          { icon: LayoutDashboard, href: base, label: "ภาพรวม", permission: PERMISSIONS.REPORT_READ },
          { icon: CalendarDays, href: `${base}/settings`, label: "ตั้งค่างาน", permission: PERMISSIONS.EVENT_UPDATE },
          { icon: ClipboardCheck, href: `${base}/tickets/payments`, label: "ตรวจชำระเงิน", permission: PERMISSIONS.ORDER_REVIEW },
          {
            icon: TicketPercent,
            href: `${base}/tickets`,
            label: "บัตรและเสื้อ",
            permission: PERMISSIONS.EVENT_UPDATE,
          },
          { icon: Users, href: `${base}/users`, label: "ผู้ใช้และสิทธิ์", permission: PERMISSIONS.PERMISSION_MANAGE },
          { icon: Store, href: `${base}/vendors`, label: "ร้านค้า", permission: PERMISSIONS.STORE_MANAGE },
          { icon: FileText, href: `${base}/reports`, label: "รายงานและส่งออก", permission: PERMISSIONS.REPORT_EXPORT },
          { icon: History, href: `${base}/history`, label: "ประวัติแก้ไข", permission: PERMISSIONS.REPORT_READ },
        ].filter((item) => !item.permission || can(item.permission)),
      },
    ];
  }

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  return (
    <Sidebar collapsible="icon" className="flex items-center justify-center">
      <SidebarHeader className="flex items-center justify-center">
        {sidebarState && (
          <Link href="/admin" className="border border-brand">
            <Brand />
          </Link>
        )}
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => {
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="text-sm md:text-xs group-data-[collapsible=icon]:pointer-events-none">
                {sidebarState && <span>{group.label}</span>}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-start group-data-[collapsible=icon]:items-center">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === `/admin/${slug}`
                        ? pathname === `/admin/${slug}`
                        : pathname.startsWith(item.href);

                    return (
                      <SidebarMenuItem key={item.href} className="mt-2">
                        <SidebarMenuButton
                          asChild
                          onClick={() => setOpenMobile(false)}
                          tooltip={item.label}
                          className={cn(
                            isActive
                              ? "bg-brand text-on-brand font-semibold hover:bg-brand hover:text-on-brand"
                              : "hover:border hover:border-brand-hover hover:text-brand-hover",
                          )}
                        >
                          <Link href={item.href}>
                            <Icon />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
