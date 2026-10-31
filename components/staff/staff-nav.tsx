"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coins,
  History,
  LayoutDashboard,
  LogIn,
  ScanLine,
  Search,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; sub: string; icon: LucideIcon };

export const staffNav: NavItem[] = [
  { href: "/staff", label: "ภาพรวม", sub: "Staff Dashboard", icon: LayoutDashboard },
  { href: "/staff/scanner", label: "สแกน QR", sub: "QR Scanner", icon: ScanLine },
  { href: "/staff/check-in", label: "เช็กอิน / เอาท์", sub: "Check-in / Check-out", icon: LogIn },
  { href: "/staff/attendees", label: "ค้นหาผู้เข้าร่วม", sub: "Attendee Search", icon: Search },
  { href: "/staff/history", label: "ประวัติการสแกน", sub: "Scan History", icon: History },
  { href: "/staff/top-up", label: "เติม Token", sub: "Staff Token Top-up", icon: Coins },
  { href: "/staff/validation", label: "ข้อความแจ้งเตือน", sub: "Scan Validation", icon: ShieldAlert },
];

function isActive(pathname: string, href: string) {
  return href === "/staff" ? pathname === href : pathname.startsWith(href);
}

export function StaffSidebarNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="เมนูเจ้าหน้าที่" className="flex flex-col gap-1">
      {staffNav.map(({ href, label, sub, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "bg-brand-soft font-medium text-brand"
                : "text-foreground/80 hover:bg-muted"
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="flex flex-col leading-tight">
              <span>{label}</span>
              <span className="text-xs font-normal text-muted-foreground">{sub}</span>
            </span>
          </Link>
        );
      })}
    </nav>
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
        const active = isActive(pathname, href);
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
