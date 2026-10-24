"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
  CircleDollarSign,
  FolderUsers,
  GraphStar,
  HouseCog,
  LayoutDashboard,
  ListClock,
  LucideIcon,
  SquareKanban,
  Store,
  TicketPercent,
  UserShield,
} from "lucide-react";
import { cn } from "cn";

type NavItem = {
  icon: LucideIcon;
  href: string;
  label: string;
};

type NAV_GROUPS = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS = [
  {
    icon: LayoutDashboard,
    label: "ภาพรวม",
    items: [{ icon: LayoutDashboard, href: "/admin", label: "Dashboard" }],
  },
  {
    label: "ตั้งค่า",
    items: [
      {
        icon: HouseCog,
        href: "/admin/settings/event",
        label: "ตั้งค่างาน",
      },
      {
        icon: TicketPercent,
        href: "/admin/settings/pricing",
        label: "ราคาบัตร/เสื้อ",
      },
      {
        icon: CircleDollarSign,
        href: "/admin/settings/token-rate",
        label: "เรท Token",
      },
    ],
  },
  {
    label: "จัดการข้อมูล",
    items: [
      {
        icon: FolderUsers,
        href: "/admin/manage/users",
        label: "รายชื่อผู้ลงทะเบียน",
      },
      {
        icon: Store,
        href: "/admin/manage/vendors",
        label: "รายการร้านค้า",
      },
      {
        icon: UserShield,
        href: "/admin/manage/permissions",
        label: "สิทธิ์ผู้ดูแล",
      },
    ],
  },
  {
    label: "รายงาย",
    items: [
      {
        icon: SquareKanban,
        href: "/admin/reports/overview",
        label: "รายงานภาพรวม",
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
  const { state, setOpenMobile } = useSidebar();
  const pathname = usePathname();

  const sidebarState = state === "expanded";

  return (
    <Sidebar collapsible="icon" className="flex items-center justify-center">
      <SidebarHeader className="text-xl font-bold text-brand flex flex-row items-center justify-center">
        {sidebarState && <span>Admin panel</span>}
        <GraphStar size={30} />
      </SidebarHeader>
      <SidebarContent>
        {NAV_GROUPS.map((group) => {
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none">
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
                      <SidebarMenuItem key={item.href}>
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
                            <Icon size={sidebarState ? 50 : 15} />
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
