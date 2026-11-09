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
  ShieldAlert,
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  { href: "/staff/validation", label: "ข้อความแจ้งเตือน", sub: "Scan Validation", icon: ShieldAlert },
];

function isItemActive(pathname: string, href: string) {
  return href === "/staff" ? pathname === href : pathname.startsWith(href);
}

export function StaffSidebarNav() {
  const { state, setOpenMobile, setOpen } = useSidebar();
  const pathname = usePathname();
  const sidebarExpanded = state === "expanded";

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  return (
    <Sidebar collapsible="icon" className="flex items-center justify-center">
      <SidebarHeader className="flex items-center justify-center">
        {sidebarExpanded && (
          <div className="flex items-center gap-2.5 px-2 py-1">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-on-brand shrink-0">
              <QrCode className="size-5" aria-hidden />
            </span>
            <div className="leading-tight text-left min-w-0">
              <p className="font-semibold text-sm truncate">TuaTua</p>
              <p className="text-xs text-muted-foreground truncate">Staff &amp; Check-in</p>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm md:text-xs group-data-[collapsible=icon]:pointer-events-none">
            {sidebarExpanded && <span>พื้นที่เจ้าหน้าที่</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-start group-data-[collapsible=icon]:items-center">
              {staffNav.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(pathname, item.href);

                return (
                  <SidebarMenuItem key={item.href} className="mt-2">
                    <SidebarMenuButton
                      asChild
                      onClick={() => setOpenMobile(false)}
                      tooltip={item.label}
                      className={cn(
                        active
                          ? "bg-brand text-on-brand font-semibold hover:bg-brand hover:text-on-brand"
                          : "hover:border hover:border-brand-hover hover:text-brand-hover"
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
      </SidebarContent>

      <SidebarFooter className="p-2">
        {sidebarExpanded ? (
          <div className="rounded-lg bg-muted p-2.5 text-xs">
            <p className="font-medium text-foreground truncate">{staffProfile.name}</p>
            <p className="text-muted-foreground truncate">{staffProfile.role}</p>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted cursor-default"
                aria-label={`${staffProfile.name} (${staffProfile.role})`}
              >
                <User className="size-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium">{staffProfile.name}</p>
              <p className="text-xs text-muted-foreground">{staffProfile.role}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

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
