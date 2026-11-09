"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Coins, Search, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/staff/page-header";
import { AttendeeStatusBadge } from "@/components/staff/status-badge";
import { cn } from "@/lib/utils";
import { attendees, formatTokens, type AttendeeStatus } from "@/lib/staff-mock";

type Filter = "all" | AttendeeStatus;

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "not-arrived", label: "ยังไม่เข้างาน" },
  { value: "checked-in", label: "อยู่ในงาน" },
  { value: "checked-out", label: "ออกแล้ว" },
];

export default function AttendeeSearchPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return attendees.filter(
      (a) =>
        (filter === "all" || a.status === filter) &&
        (!q || a.name.toLowerCase().includes(q) || a.ticketId.toLowerCase().includes(q))
    );
  }, [query, filter]);

  return (
    <>
      <PageHeader
        eyebrow="Attendee Search"
        title="ค้นหารายชื่อผู้เข้าร่วม"
        description="ค้นหาด้วยชื่อหรือรหัสบัตร เมื่อผู้เข้าร่วมไม่มี QR"
      />

      <div className="rounded-xl border bg-background p-4 sm:p-5">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <label htmlFor="attendee-q" className="sr-only">ค้นหาผู้เข้าร่วม</label>
          <input
            id="attendee-q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อ หรือรหัสบัตร เช่น TT-000125"
            className="h-11 w-full rounded-lg border bg-background pr-3 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div role="group" aria-label="กรองตามสถานะ" className="mt-3 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                filter === f.value
                  ? "border-brand bg-brand text-on-brand"
                  : "bg-background hover:bg-muted"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 mb-2 text-sm text-muted-foreground" aria-live="polite">
        พบ {results.length} รายการ
      </p>

      {results.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed bg-background px-4 py-12 text-center">
          <SearchX className="size-8 text-muted-foreground" aria-hidden />
          <p className="mt-3 font-medium">ไม่พบผู้เข้าร่วมที่ตรงกับคำค้นหา</p>
          <p className="mt-1 text-sm text-muted-foreground">ลองตรวจตัวสะกด หรือเปลี่ยนตัวกรองสถานะ</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
          >
            ล้างการค้นหา
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {results.map((a) => (
            <li key={a.id} className="rounded-xl border bg-background p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{a.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <span className="font-mono">{a.ticketId}</span> · บัตร {a.ticketType}
                  </p>
                </div>
                <AttendeeStatusBadge status={a.status} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <Coins className="size-3.5" aria-hidden />
                  {formatTokens(a.tokens)} Token
                </span>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/staff/top-up">เติม Token</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-brand text-on-brand hover:bg-brand-hover">
                    <Link href="/staff/check-in">เช็กอิน/เอาท์</Link>
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
