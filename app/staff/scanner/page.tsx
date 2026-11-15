"use client";

import { useState } from "react";
import { Camera, Keyboard, LogIn, LogOut, ScanLine, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/staff/page-header";
import { ScanResultCard } from "@/components/staff/scan-result";
import { cn } from "@/lib/utils";
import type { ScanOutcome } from "@/lib/staff-mock";

type Mode = "in" | "out";

const demoOutcomes: { outcome: ScanOutcome; label: string }[] = [
  { outcome: "checked-in", label: "สำเร็จ" },
  { outcome: "expired", label: "QR หมดอายุ" },
  { outcome: "duplicate", label: "สแกนซ้ำ" },
  { outcome: "invalid", label: "บัตรไม่ถูกต้อง" },
];

export default function ScannerPage() {
  const [mode, setMode] = useState<Mode>("in");
  const [torch, setTorch] = useState(false);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ScanOutcome | null>(null);

  function simulate(outcome: ScanOutcome) {
    if (outcome === "checked-in" && mode === "out") setResult("checked-out");
    else setResult(outcome);
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    simulate(/^TT-\d{6}$/i.test(code.trim()) ? "checked-in" : "invalid");
    setCode("");
  }

  return (
    <>
      <PageHeader
        eyebrow="QR Scanner"
        title="สแกน QR ผู้เข้าร่วม"
        description="เล็งกล้องไปที่ QR บนบัตรหรือในแอปของผู้เข้าร่วม"
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-xl border bg-background p-4 sm:p-5">
          <div
            role="group"
            aria-label="โหมดการสแกน"
            className="mx-auto mb-4 grid max-w-sm grid-cols-2 rounded-lg bg-muted p-1"
          >
            {(
              [
                { value: "in", label: "เช็กอิน", icon: LogIn },
                { value: "out", label: "เช็กเอาท์", icon: LogOut },
              ] as const
            ).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                  mode === value
                    ? "bg-brand text-on-brand shadow-sm"
                    : "text-foreground/70 hover:text-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            ))}
          </div>

          <div
            className="relative mx-auto flex aspect-square w-full max-w-sm items-center justify-center overflow-hidden rounded-2xl bg-neutral-900"
            role="img"
            aria-label="พื้นที่แสดงภาพจากกล้องสำหรับสแกน QR"
          >
            <Camera className="size-10 text-white/25" aria-hidden />
            <div className="absolute inset-[16%]">
              {(["top-0 left-0 border-t-4 border-l-4 rounded-tl-xl",
                "top-0 right-0 border-t-4 border-r-4 rounded-tr-xl",
                "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl",
                "bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl"] as const).map((c) => (
                <span key={c} className={cn("absolute size-8 border-brand", c)} />
              ))}
              <span className="animate-scan-line absolute inset-x-2 top-0 h-0.5 rounded-full bg-brand shadow-[0_0_12px_2px_var(--color-brand)]" />
            </div>
            <p className="absolute inset-x-0 bottom-4 text-center text-xs text-white/70">
              วาง QR ให้อยู่ในกรอบ
            </p>
            {torch && (
              <span className="absolute top-3 left-3 rounded-full bg-white/15 px-2 py-0.5 text-xs text-white">
                ไฟฉายเปิด
              </span>
            )}
          </div>

          <div className="mx-auto mt-4 flex max-w-sm gap-2">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              aria-pressed={torch}
              onClick={() => setTorch((t) => !t)}
            >
              <Zap data-icon="inline-start" aria-hidden />
              {torch ? "ปิดไฟฉาย" : "เปิดไฟฉาย"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => setResult(null)}
              disabled={!result}
            >
              <ScanLine data-icon="inline-start" aria-hidden />
              สแกนต่อ
            </Button>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-xl border bg-background p-4 sm:p-5" aria-live="polite">
            <h2 className="mb-3 font-medium">ผลการสแกน</h2>
            {result ? (
              <ScanResultCard
                outcome={result}
                name={result === "invalid" ? undefined : "ธนกร วงศ์สกุล"}
                ticketId={result === "invalid" ? "TT-999001" : "TT-000124"}
              >
                <Button
                  size="sm"
                  className="bg-brand text-on-brand hover:bg-brand-hover"
                  onClick={() => setResult(null)}
                >
                  สแกนคนถัดไป
                </Button>
              </ScanResultCard>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                รอการสแกน… ผลลัพธ์จะแสดงที่นี่
              </div>
            )}
          </section>

          <section className="rounded-xl border bg-background p-4 sm:p-5">
            <h2 className="mb-1 flex items-center gap-2 font-medium">
              <Keyboard className="size-4" aria-hidden />
              กรอกรหัสบัตรเอง
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">ใช้เมื่อกล้องสแกนไม่ติด</p>
            <form onSubmit={submitManual} className="flex gap-2">
              <label htmlFor="ticket-code" className="sr-only">รหัสบัตร</label>
              <input
                id="ticket-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="เช่น TT-000124"
                autoComplete="off"
                className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-3 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <Button type="submit" size="lg" className="bg-brand text-on-brand hover:bg-brand-hover">
                ตรวจสอบ
              </Button>
            </form>
          </section>

          <section className="rounded-xl border border-dashed bg-background p-4 sm:p-5">
            <h2 className="mb-1 text-sm font-medium">ทดลองผลลัพธ์ (เฉพาะ UI ตัวอย่าง)</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {demoOutcomes.map(({ outcome, label }) => (
                <Button key={outcome} variant="secondary" size="sm" onClick={() => simulate(outcome)}>
                  {label}
                </Button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
