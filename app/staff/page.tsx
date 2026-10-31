import Link from "next/link";
import { ArrowRight, Coins, LogIn, ScanLine, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/staff/page-header";
import { OutcomeBadge } from "@/components/staff/status-badge";
import {
  attendees,
  eventInfo,
  formatTokens,
  scanHistory,
  staffProfile,
} from "@/lib/staff-mock";

export default function StaffDashboardPage() {
  const total = attendees.length;
  const checkedIn = attendees.filter((a) => a.status === "checked-in").length;
  const checkedOut = attendees.filter((a) => a.status === "checked-out").length;
  const waiting = total - checkedIn - checkedOut;
  const percent = Math.round(((checkedIn + checkedOut) / total) * 100);
  const quotaLeft = staffProfile.topUpQuotaTotal - staffProfile.topUpQuotaUsed;

  const stats = [
    { label: "ผู้เข้าร่วมทั้งหมด", value: total, note: `ความจุงาน ${formatTokens(eventInfo.capacity)} คน` },
    { label: "อยู่ในงานตอนนี้", value: checkedIn, note: "เช็กอินแล้ว" },
    { label: "ออกจากงานแล้ว", value: checkedOut, note: "เช็กเอาท์แล้ว" },
    { label: "ยังไม่เข้างาน", value: waiting, note: "รอเช็กอิน" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Staff Dashboard"
        title="ภาพรวมผู้เข้าร่วมและยอดเช็กอิน"
        description={`${eventInfo.name} · ${eventInfo.date}`}
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
            <p className="mt-1 text-3xl font-semibold tabular-nums">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.note}</p>
          </div>
        ))}
      </section>

      <section className="mt-4 rounded-xl border bg-background p-4 sm:p-5">
        <div className="flex items-center justify-between text-sm">
          <h2 className="font-medium">ความคืบหน้าการเช็กอิน</h2>
          <span className="tabular-nums text-muted-foreground">{percent}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="ความคืบหน้าการเช็กอิน"
          className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          เข้างานแล้ว {checkedIn + checkedOut} จาก {total} คน (ข้อมูลตัวอย่าง)
        </p>
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
          <ul className="divide-y">
            {scanHistory.slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.attendeeName}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-mono">{r.ticketId}</span> · {r.time} น.
                  </p>
                </div>
                <OutcomeBadge outcome={r.outcome} />
              </li>
            ))}
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
          <div className="rounded-xl border bg-brand-soft p-4 sm:p-5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="size-4 text-brand" aria-hidden />
              โควตาเติม Token ของคุณ
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {formatTokens(quotaLeft)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                / {formatTokens(staffProfile.topUpQuotaTotal)} Token
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">คงเหลือสำหรับวันนี้</p>
          </div>
        </section>
      </div>
    </>
  );
}
