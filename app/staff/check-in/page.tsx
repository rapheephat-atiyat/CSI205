"use client";

import { useState } from "react";
import { Coins, LogIn, LogOut, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/staff/page-header";
import { AttendeeStatusBadge } from "@/components/staff/status-badge";
import { ScanResultCard } from "@/components/staff/scan-result";
import { cn } from "@/lib/utils";
import { formatTokens } from "@/lib/staff-mock";
import { api } from "@/lib/api-client";
import { useStaff } from "@/components/staff/staff-context";

type Feedback = { kind: "checked-in" | "checked-out" | "duplicate"; name: string; ticketId: string };

export default function CheckInPage() {
  const { attendees, checkInOrOut } = useStaff();
  const [selectedId, setSelectedId] = useState(() => attendees[1]?.id ?? attendees[0]?.id ?? "");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const selected = attendees.find((a) => a.id === selectedId) ?? attendees[0];

  async function apply(action: "in" | "out") {
    if (!selected) return;

    try {
      await api.tickets.scan({ qrToken: selected.ticketId, action });
    } catch {
      // offline / mock mode fallback
    }

    const res = checkInOrOut(selected.id, action);

    setFeedback({
      kind: res.outcome,
      name: selected.name,
      ticketId: selected.ticketId,
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="Check-in / Check-out"
        title="เช็กอินและเช็กเอาท์"
        description="เลือกผู้เข้าร่วม ตรวจข้อมูลบัตร แล้วบันทึกการเข้า–ออก"
      />

      <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <section className="rounded-xl border bg-background">
          <h2 className="border-b px-4 py-3 text-sm font-medium">ผู้เข้าร่วม</h2>
          <ul className="max-h-[26rem] divide-y overflow-y-auto">
            {attendees.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(a.id);
                    setFeedback(null);
                  }}
                  aria-pressed={a.id === selected.id}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-4 py-3 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50",
                    a.id === selected.id ? "bg-brand-soft" : "hover:bg-muted"
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{a.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{a.ticketId}</span>
                  </span>
                  <AttendeeStatusBadge status={a.status} />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border bg-background p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
            <div>
              <p className="text-xs text-muted-foreground">ข้อมูลผู้เข้าร่วม</p>
              <h2 className="mt-0.5 text-xl font-semibold">{selected.name}</h2>
              <p className="font-mono text-xs text-muted-foreground">{selected.ticketId}</p>
            </div>
            <AttendeeStatusBadge status={selected.status} />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-muted/60 p-3">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Ticket className="size-3.5" aria-hidden />
                ประเภทบัตร
              </dt>
              <dd className="mt-1 font-medium">{selected.ticketType.startsWith("บัตร") ? selected.ticketType : `บัตร${selected.ticketType}`}</dd>
            </div>
            <div className="rounded-lg bg-muted/60 p-3">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Coins className="size-3.5" aria-hidden />
                Token คงเหลือ
              </dt>
              <dd className="mt-1 font-medium tabular-nums">{formatTokens(selected.tokens)}</dd>
            </div>
            <div className="col-span-2 rounded-lg bg-muted/60 p-3 sm:col-span-1">
              <dt className="text-xs text-muted-foreground">เวลาล่าสุด</dt>
              <dd className="mt-1 font-medium">{selected.lastActionAt ?? "—"}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              size="lg"
              className="flex-1 bg-brand text-on-brand hover:bg-brand-hover"
              disabled={selected.status === "checked-in"}
              onClick={() => apply("in")}
            >
              <LogIn data-icon="inline-start" aria-hidden />
              บันทึกเข้างาน (Check-in)
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              disabled={selected.status !== "checked-in"}
              onClick={() => apply("out")}
            >
              <LogOut data-icon="inline-start" aria-hidden />
              บันทึกออกงาน (Check-out)
            </Button>
          </div>

          {feedback && (
            <div className="mt-4" aria-live="polite">
              <ScanResultCard
                outcome={feedback.kind}
                name={feedback.name}
                ticketId={feedback.ticketId}
              />
            </div>
          )}
        </section>
      </div>
    </>
  );
}
