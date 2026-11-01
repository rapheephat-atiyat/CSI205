"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";

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
  FolderUsers,
  LayoutDashboard,
  ListClock,
  LucideIcon,
  Store,
  TicketPercent,
  Users,
} from "lucide-react";
import { cn } from "cn";
import Brand from "@/components/core/Brand";
import { useEffect } from "react";

type NavItem = {
  icon: LucideIcon;
  href: string;
  label: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "พื้นที่ผู้ดูแลส่วนกลาง",
    items: [
      {
        icon: LayoutDashboard,
        href: "/admin",
        label: "ภาพรวม",
      },
      {
        icon: CalendarDays,
        href: "/admin/settings/event",
        label: "ตั้งค่างาน",
      },
      {
        icon: TicketPercent,
        href: "/admin/settings/pricing",
        label: "บัตรและเสื้อ",
      },
      {
        icon: Users,
        href: "/admin/manage/users",
        label: "ผู้ใช้และสิทธิ์",
      },
      {
        icon: Store,
        href: "/admin/manage/vendors",
        label: "ร้านค้า",
      },
      {
        icon: FileText,
        href: "/admin/reports/overview",
        label: "รายงานและส่งออก",
      },
      {
        icon: ListClock,
        href: "/admin/reports/audit-log",
        label: "ประวัติแก้ไข",
      },
    ],
  },
];

export default function AdminNav() {
  const { open, setOpen, state, toggleSidebar, setOpenMobile } = useSidebar();
  const pathname = usePathname();

  const sidebarState = state === "expanded";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sidebar collapsible="icon" className="flex items-center justify-center">
      <SidebarHeader className="flex items-center justify-center">
        {sidebarState && <Brand />}
      </SidebarHeader>
      <SidebarContent>
        {NAV_GROUPS.map((group) => {
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
                      item.href === "/admin"
                        ? pathname === "/admin"
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
