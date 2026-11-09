"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Coins,
  History,
  LayoutDashboard,
  LogIn,
  QrCode,
  ScanLine,
  Search,
  User,
  type LucideIcon,
} from "lucide-react";
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
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { staffProfile } from "@/lib/staff-mock";

export type NavItem = { href: string; label: string; sub: string; icon: LucideIcon };

export const staffNav: NavItem[] = [
  { href: "/staff", label: "ภาพรวม", sub: "Staff Dashboard", icon: LayoutDashboard },
  { href: "/staff/scanner", label: "สแกน QR", sub: "QR Scanner", icon: ScanLine },
  { href: "/staff/check-in", label: "เช็กอิน / เอาท์", sub: "Check-in / Check-out", icon: LogIn },
  { href: "/staff/attendees", label: "ค้นหาผู้เข้าร่วม", sub: "Attendee Search", icon: Search },
  { href: "/staff/history", label: "ประวัติการสแกน", sub: "Scan History", icon: History },
  { href: "/staff/top-up", label: "เติม Token", sub: "Staff Token Top-up", icon: Coins },
];

function isItemActive(pathname: string, href: string) {
  return href === "/staff" ? pathname === href : pathname.startsWith(href);
}

export function StaffSidebarNav({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state, setOpenMobile, setOpen } = useSidebar();
  const pathname = usePathname();
  const sidebarExpanded = state === "expanded";

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {sidebarExpanded ? (
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-on-brand shrink-0">
              <QrCode className="size-4" aria-hidden />
            </span>
            <div className="leading-tight text-left min-w-0">
              <p className="font-semibold text-sm truncate">TuaTua</p>
              <p className="text-xs text-muted-foreground truncate">Staff &amp; Check-in</p>
            </div>
          </div>
        ) : null}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            พื้นที่เจ้าหน้าที่
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {staffNav.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(pathname, item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className={cn(
                        active &&
                          "bg-brand text-on-brand font-semibold hover:bg-brand hover:text-on-brand"
                      )}
                    >
                      <Link href={item.href} onClick={() => setOpenMobile(false)}>
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
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {sidebarExpanded ? (
              <div className="flex items-center gap-2 rounded-lg bg-muted p-2 text-xs">
                <div className="flex size-7 items-center justify-center rounded-full bg-brand/10 text-brand font-semibold shrink-0">
                  <User className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{staffProfile.name}</p>
                  <p className="text-muted-foreground truncate">{staffProfile.role}</p>
                </div>
              </div>
            ) : (
              <SidebarMenuButton
                size="default"
                tooltip={`${staffProfile.name} (${staffProfile.role})`}
                className="justify-center"
              >
                <User className="size-4" />
                <span className="sr-only">{staffProfile.name}</span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export { StaffSidebarNav as StaffSidebar, StaffSidebarNav as AppSidebar };

export function StaffTabNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="เมนูเจ้าหน้าที่"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] lg:hidden"
    >
      {staffNav.map(({ href, label, icon: Icon }) => {
        const active = isItemActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "border-brand bg-brand text-on-brand"
                : "border-border bg-background text-foreground/80 hover:bg-muted"
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
