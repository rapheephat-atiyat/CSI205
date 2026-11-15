"use client";

import { useState } from "react";
import { History, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/staff/page-header";
import { OutcomeBadge } from "@/components/staff/status-badge";
import { cn } from "@/lib/utils";
import { scanHistory } from "@/lib/staff-mock";

type Filter = "all" | "in" | "out" | "error";

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "in", label: "เข้า" },
  { value: "out", label: "ออก" },
  { value: "error", label: "มีปัญหา" },
];

const isError = (o: string) => o === "expired" || o === "duplicate" || o === "invalid";

export default function ScanHistoryPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const rows = scanHistory.filter((r) =>
    filter === "all"
      ? true
      : filter === "error"
        ? isError(r.outcome)
        : r.action === filter
  );

  return (
    <>
      <PageHeader
        eyebrow="Scan History"
        title="ประวัติการสแกนเข้าและออก"
        description="รายการที่คุณสแกนในวันนี้ เรียงจากล่าสุด"
      />

      <div role="group" aria-label="กรองประวัติ" className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
              filter === f.value ? "border-brand bg-brand text-on-brand" : "bg-background hover:bg-muted"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed bg-background px-4 py-12 text-center">
          <History className="size-8 text-muted-foreground" aria-hidden />
          <p className="mt-3 font-medium">ยังไม่มีประวัติในหมวดนี้</p>
          <Button variant="outline" className="mt-4" onClick={() => setFilter("all")}>
            ดูทั้งหมด
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border bg-background md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">เวลา</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">ผู้เข้าร่วม</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">รหัสบัตร</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">การกระทำ</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">ผลลัพธ์</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 tabular-nums">{r.time}</td>
                    <td className="px-4 py-3 font-medium">{r.attendeeName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.ticketId}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1">
                        {r.action === "in" ? (
                          <LogIn className="size-3.5" aria-hidden />
                        ) : (
                          <LogOut className="size-3.5" aria-hidden />
                        )}
                        {r.action === "in" ? "เข้า" : "ออก"}
                      </span>
                    </td>
                    <td className="px-4 py-3"><OutcomeBadge outcome={r.outcome} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="grid gap-3 md:hidden">
            {rows.map((r) => (
              <li key={r.id} className="rounded-xl border bg-background p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{r.attendeeName}</p>
                  <OutcomeBadge outcome={r.outcome} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="font-mono">{r.ticketId}</span> · {r.action === "in" ? "เข้า" : "ออก"} ·{" "}
                  {r.time} น.
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
