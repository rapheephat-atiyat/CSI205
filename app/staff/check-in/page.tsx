"use client";

import { useEffect, useState } from "react";
import { Coins, LogIn, LogOut, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/staff/page-header";
import { AttendeeStatusBadge } from "@/components/staff/status-badge";
import { ScanResultCard } from "@/components/staff/scan-result";
import { cn } from "@/lib/utils";
import { attendees as seed, formatTokens, type Attendee } from "@/lib/staff-mock";
import { api } from "@/lib/api-client";
import { saveScanRecord } from "@/lib/staff-storage";

type Feedback = { kind: "checked-in" | "checked-out" | "duplicate"; name: string; ticketId: string };

function nowTime() {
  return new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

export default function CheckInPage() {
  const [list, setList] = useState<Attendee[]>(seed);
  const [selectedId, setSelectedId] = useState(seed[1].id);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    async function loadAttendees() {
      try {
        const res = await api.staff.attendees();
        if (res.success && res.data && res.data.length > 0) {
          const mapped: Attendee[] = res.data.map((item) => ({
            id: item.id,
            name: item.name,
            ticketId: item.ticketId,
            ticketType: (item.ticketType as Attendee["ticketType"]) || "General",
            status: item.status,
            tokens: item.tokens,
            lastActionAt: item.lastActionAt,
          }));
          setList(mapped);
          setSelectedId(mapped[0]?.id ?? seed[0].id);
        }
      } catch {
        // use default seed
      }
    }
    loadAttendees();
  }, []);

  const selected = list.find((a) => a.id === selectedId) ?? list[0];

  async function apply(action: "in" | "out") {
    const already =
      (action === "in" && selected.status === "checked-in") ||
      (action === "out" && selected.status !== "checked-in");
    if (already) {
      setFeedback({ kind: "duplicate", name: selected.name, ticketId: selected.ticketId });
      saveScanRecord({
        time: nowTime(),
        attendeeName: selected.name,
        ticketId: selected.ticketId,
        action,
        outcome: "duplicate",
      });
      return;
    }

    try {
      await api.tickets.scan({ qrToken: selected.ticketId, action });
    } catch {
      // offline / mock mode fallback
    }

    setList((prev) =>
      prev.map((a) =>
        a.id === selected.id
          ? { ...a, status: action === "in" ? "checked-in" : "checked-out", lastActionAt: nowTime() }
          : a
      )
    );

    const kind = action === "in" ? "checked-in" : "checked-out";
    setFeedback({
      kind,
      name: selected.name,
      ticketId: selected.ticketId,
    });

    saveScanRecord({
      time: nowTime(),
      attendeeName: selected.name,
      ticketId: selected.ticketId,
      action,
      outcome: kind,
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
            {list.map((a) => (
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
              <dd className="mt-1 font-medium">{selected.ticketType}</dd>
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
