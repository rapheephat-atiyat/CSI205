"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, Keyboard, LogIn, LogOut, ScanLine, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/staff/page-header";
import { ScanResultCard } from "@/components/staff/scan-result";
import { cn } from "@/lib/utils";
import type { ScanOutcome } from "@/lib/staff-mock";
import { api } from "@/lib/api-client";
import { useStaff } from "@/components/staff/staff-context";

type Mode = "in" | "out";

const demoOutcomes: { outcome: ScanOutcome; label: string }[] = [
  { outcome: "checked-in", label: "สำเร็จ" },
  { outcome: "expired", label: "QR หมดอายุ" },
  { outcome: "duplicate", label: "สแกนซ้ำ" },
  { outcome: "invalid", label: "บัตรไม่ถูกต้อง" },
];

export default function ScannerPage() {
  const { attendees, checkInOrOut, addScan } = useStaff();
  const [mode, setMode] = useState<Mode>("in");
  const [torch, setTorch] = useState(false);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ScanOutcome | null>(null);
  const [resultName, setResultName] = useState<string | undefined>("ธนกร วงศ์สกุล");
  const [resultTicket, setResultTicket] = useState<string>("TT-000124");
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks helper
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Process code through API or fallback simulation
  const processCode = useCallback(async (rawCode: string) => {
    const cleanCode = rawCode.trim();
    if (!cleanCode || isProcessing) return;

    setIsProcessing(true);
    const nowTime = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

    try {
      const res = await api.tickets.scan({ qrToken: cleanCode, action: mode });
      if (res.success) {
        const ticket = res.data;
        const outcome: ScanOutcome = mode === "out" ? "checked-out" : "checked-in";
        const fullName = `${ticket.firstName ?? ""} ${ticket.lastName ?? ""}`.trim() || ticket.ticketTypeName || "ผู้เข้าร่วม";
        const tId = ticket.ticketCode;

        setResult(outcome);
        setResultName(fullName);
        setResultTicket(tId);

        checkInOrOut(tId, mode);
      } else {
        const errCode = res.error?.code ?? "";
        let outcome: ScanOutcome = "invalid";
        if (errCode === "TICKET_ALREADY_USED") outcome = "duplicate";
        else if (errCode === "TICKET_NOT_ACTIVE") outcome = "expired";
        else if (errCode === "TICKET_NOT_CHECKED_IN") outcome = "duplicate";

        const matched = attendees.find((a) => a.ticketId.toLowerCase() === cleanCode.toLowerCase());
        const name = matched ? matched.name : undefined;

        setResult(outcome);
        setResultName(name);
        setResultTicket(cleanCode);

        addScan({
          time: nowTime,
          attendeeName: name ?? "ไม่ทราบชื่อ",
          ticketId: cleanCode,
          action: mode,
          outcome,
        });
      }
    } catch {
      // Fallback local processing
      const checkRes = checkInOrOut(cleanCode, mode);
      if (checkRes.attendee) {
        setResult(checkRes.outcome);
        setResultName(checkRes.attendee.name);
        setResultTicket(checkRes.attendee.ticketId);
      } else {
        const isFormatOk = /^TT-\d{6}$/i.test(cleanCode);
        const outcome: ScanOutcome = isFormatOk ? (mode === "out" ? "checked-out" : "checked-in") : "invalid";
        const name = isFormatOk ? "ธนกร วงศ์สกุล" : undefined;

        setResult(outcome);
        setResultName(name);
        setResultTicket(cleanCode);

        addScan({
          time: nowTime,
          attendeeName: name ?? "ไม่ทราบชื่อ",
          ticketId: cleanCode,
          action: mode,
          outcome,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [mode, isProcessing, attendees, checkInOrOut, addScan]);

  // Start camera on mount
  useEffect(() => {
    let active = true;

    async function initCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) return;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        // Camera permission denied or not available; fallback to manual input silently
      }
    }

    initCamera();

    return () => {
      active = false;
      stopCamera();
    };
  }, [stopCamera]);

  // Barcode detection loop if supported
  useEffect(() => {
    if (!videoRef.current || result) return;

    let scanTimer: NodeJS.Timeout;
    const BarcodeDetectorClass = typeof window !== "undefined" && "BarcodeDetector" in window
      ? (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector
      : null;

    if (BarcodeDetectorClass) {
      try {
        const detector = new BarcodeDetectorClass({ formats: ["qr_code"] });
        scanTimer = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === 4 && !result) {
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes.length > 0 && codes[0].rawValue) {
                processCode(codes[0].rawValue);
              }
            } catch {
              // detection frame error ignore
            }
          }
        }, 600);
      } catch {
        // BarcodeDetector options not supported
      }
    }

    return () => {
      if (scanTimer) clearInterval(scanTimer);
    };
  }, [result, processCode]);

  // Toggle flashlight if camera track supports it
  async function toggleTorch() {
    const next = !torch;
    setTorch(next);
    if (mediaStreamRef.current) {
      const track = mediaStreamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          const capabilities = (track.getCapabilities?.() as { torch?: boolean }) ?? {};
          if (capabilities.torch) {
            await (track as MediaStreamTrack & { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
              advanced: [{ torch: next }],
            });
          }
        } catch {
          // ignore
        }
      }
    }
  }

  function simulate(outcome: ScanOutcome) {
    const nowTime = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    const finalOutcome: ScanOutcome = outcome === "checked-in" && mode === "out" ? "checked-out" : outcome;
    const name = outcome === "invalid" ? undefined : "ธนกร วงศ์สกุล";
    const tId = outcome === "invalid" ? "TT-999001" : "TT-000124";

    setResult(finalOutcome);
    setResultName(name);
    setResultTicket(tId);

    addScan({
      time: nowTime,
      attendeeName: name ?? "ไม่ทราบชื่อ",
      ticketId: tId,
      action: mode,
      outcome: finalOutcome,
    });
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    processCode(code.trim());
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
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 size-full object-cover"
            />
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
              onClick={toggleTorch}
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
                name={result === "invalid" ? undefined : resultName}
                ticketId={resultTicket}
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
                {isProcessing ? "กำลังตรวจสอบข้อมูลบัตร…" : "รอการสแกน… ผลลัพธ์จะแสดงที่นี่"}
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
              <Button type="submit" size="lg" disabled={isProcessing} className="bg-brand text-on-brand hover:bg-brand-hover">
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
