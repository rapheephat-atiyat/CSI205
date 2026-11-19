"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Coins, LogIn, ScanLine, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/staff/page-header";
import { OutcomeBadge } from "@/components/staff/status-badge";
import { eventInfo as defaultEventInfo, formatTokens } from "@/lib/staff-mock";
import { useStaff } from "@/components/staff/staff-context";

export default function StaffDashboardPage() {
  const { total, checkedIn, checkedOut, waiting, scanHistory } = useStaff();
  const [eventData] = useState(defaultEventInfo);

  const recentScans = scanHistory.slice(0, 5);

  const stats = [
    { label: "ผู้เข้าร่วมทั้งหมด", value: total, note: `ความจุงาน ${formatTokens(eventData.capacity)} คน` },
    { label: "อยู่ในงานตอนนี้", value: checkedIn, note: "เช็กอินแล้ว" },
    { label: "ออกจากงานแล้ว", value: checkedOut, note: "เช็กเอาท์แล้ว" },
    { label: "ยังไม่เข้างาน", value: waiting, note: "รอเช็กอิน" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Staff Dashboard"
        title="ภาพรวมผู้เข้าร่วมและยอดเช็กอิน"
        description={`${eventData.name} · ${eventData.date}`}
        action={
          <Button asChild size="lg" className="bg-brand text-on-brand hover:bg-brand-hover">
            <Link href="/staff/scanner">
              <ScanLine data-icon="inline-start" aria-hidden />
              เริ่มสแกน QR
            </Link>
          </Button>
        }
      />

      <section aria-label="สถิติ" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-background p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums" suppressHydrationWarning>
              {s.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground" suppressHydrationWarning>
              {s.note}
            </p>
          </div>
        ))}
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border bg-background lg:col-span-2">
          <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
            <h2 className="font-medium">การสแกนล่าสุด</h2>
            <Link
              href="/staff/history"
              className="inline-flex items-center gap-1 text-sm text-brand outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              ดูทั้งหมด <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <ul className="divide-y" suppressHydrationWarning>
            {recentScans.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                ยังไม่มีรายการสแกนล่าสุด
              </li>
            ) : (
              recentScans.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.attendeeName}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">{r.ticketId}</span> · {r.time} น.
                    </p>
                  </div>
                  <OutcomeBadge outcome={r.outcome} />
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <div className="rounded-xl border bg-background p-4 sm:p-5">
            <h2 className="font-medium">ทางลัด</h2>
            <div className="mt-3 grid gap-2">
              {[
                { href: "/staff/check-in", label: "เช็กอิน / เช็กเอาท์", icon: LogIn },
                { href: "/staff/attendees", label: "ค้นหาผู้เข้าร่วม", icon: Search },
                { href: "/staff/top-up", label: "เติม Token", icon: Coins },
              ].map(({ href, label, icon: Icon }) => (
                <Button key={href} asChild variant="outline" size="lg" className="justify-start">
                  <Link href={href}>
                    <Icon data-icon="inline-start" aria-hidden />
                    {label}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
