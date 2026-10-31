"use client";

import { useState } from "react";
import { Coins, LogIn, LogOut, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/staff/page-header";
import { AttendeeStatusBadge } from "@/components/staff/status-badge";
import { ScanResultCard } from "@/components/staff/scan-result";
import { cn } from "@/lib/utils";
import { attendees as seed, formatTokens, type Attendee } from "@/lib/staff-mock";

type Feedback = { kind: "checked-in" | "checked-out" | "duplicate"; name: string; ticketId: string };

function nowTime() {
  return new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

export default function CheckInPage() {
  const [list, setList] = useState<Attendee[]>(seed);
  const [selectedId, setSelectedId] = useState(seed[1].id);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const selected = list.find((a) => a.id === selectedId) ?? list[0];

  function apply(action: "in" | "out") {
    const already =
      (action === "in" && selected.status === "checked-in") ||
      (action === "out" && selected.status !== "checked-in");
    if (already) {
      setFeedback({ kind: "duplicate", name: selected.name, ticketId: selected.ticketId });
      return;
    }
    setList((prev) =>
      prev.map((a) =>
        a.id === selected.id
          ? { ...a, status: action === "in" ? "checked-in" : "checked-out", lastActionAt: nowTime() }
          : a
      )
    );
    setFeedback({
      kind: action === "in" ? "checked-in" : "checked-out",
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

        <section className="flex flex-col gap-4">
          <div className="rounded-xl border bg-background p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{selected.name}</h2>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Ticket className="size-3.5" aria-hidden />
                    <span className="font-mono">{selected.ticketId}</span>
                  </span>
                  <span>บัตร {selected.ticketType}</span>
                  <span className="inline-flex items-center gap-1">
                    <Coins className="size-3.5" aria-hidden />
                    {formatTokens(selected.tokens)} Token
                  </span>
                </p>
              </div>
              <AttendeeStatusBadge status={selected.status} />
            </div>
            {selected.lastActionAt && (
              <p className="mt-3 text-xs text-muted-foreground">
                บันทึกล่าสุดเวลา {selected.lastActionAt} น.
              </p>
            )}
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button
                size="lg"
                className="h-11 bg-brand text-base text-on-brand hover:bg-brand-hover"
                onClick={() => apply("in")}
              >
                <LogIn data-icon="inline-start" aria-hidden />
                เช็กอิน
              </Button>
              <Button variant="outline" size="lg" className="h-11 text-base" onClick={() => apply("out")}>
                <LogOut data-icon="inline-start" aria-hidden />
                เช็กเอาท์
              </Button>
            </div>
          </div>

          <div aria-live="polite">
            {feedback ? (
              <ScanResultCard outcome={feedback.kind} name={feedback.name} ticketId={feedback.ticketId} />
            ) : (
              <div className="rounded-xl border border-dashed bg-background p-6 text-center text-sm text-muted-foreground">
                ผลการเช็กอิน/เช็กเอาท์จะแสดงที่นี่
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
