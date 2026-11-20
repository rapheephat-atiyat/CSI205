"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, Coins, Keyboard, LogIn, LogOut, ScanLine, TriangleAlert, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/staff/page-header";
import { ScanResultCard } from "@/components/staff/scan-result";
import { cn } from "@/lib/utils";
import { formatTokens, type ScanOutcome } from "@/lib/staff-mock";
import { api } from "@/lib/api-client";
import { useStaff } from "@/components/staff/staff-context";
import { calculateTopUpBaht } from "@/lib/token-pricing";

type Mode = "in" | "out" | "topup";

type TopUpDisplay =
  | { type: "success"; name: string; ticketCode: string | null; amount: number; newBalance: number; bahtAmount: string }
  | { type: "overQuota"; message: string }
  | { type: "error"; message: string };

const baht = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });

export default function ScannerPage() {
  const { attendees, checkInOrOut, addScan, topUpTokens, quota } = useStaff();
  const [mode, setMode] = useState<Mode>("in");
  const [torch, setTorch] = useState(false);
  const [code, setCode] = useState("");
  const [topUpAmount, setTopUpAmount] = useState<number>(100);
  const [result, setResult] = useState<ScanOutcome | null>(null);
  const [topUpResult, setTopUpResult] = useState<TopUpDisplay | null>(null);
  const [resultName, setResultName] = useState<string | undefined>("ธนกร วงศ์สกุล");
  const [resultTicket, setResultTicket] = useState<string>("TT-000124");
  const [isProcessing, setIsProcessing] = useState(false);
  const [tokenRate, setTokenRate] = useState<string | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);
  const [rateRequest, setRateRequest] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processing = useRef(false);

  const refreshRate = useCallback(() => {
    setTokenRate(null);
    setRateError(null);
    setRateRequest((request) => request + 1);
  }, []);

  useEffect(() => {
    if (mode !== "topup") return;
    let active = true;
    void api.staff.tokenRate().then((response) => {
      if (!active) return;
      if (response.success) setTokenRate(response.data.bahtPerToken);
      else setRateError(response.error.message);
    });
    return () => { active = false; };
  }, [mode, rateRequest]);

  const bahtAmount = tokenRate === null ? null : calculateTopUpBaht(topUpAmount, Number(tokenRate));

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
    if (!cleanCode || processing.current || (mode === "topup" && (!tokenRate || !bahtAmount || topUpResult?.type === "success"))) return;

    processing.current = true;
    setIsProcessing(true);
    const nowTime = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

    if (mode === "topup") {
      try {
        if (!tokenRate || !bahtAmount) return;
        if (!Number.isInteger(topUpAmount) || topUpAmount <= 0) {
          setTopUpResult({ type: "error", message: "กรุณาระบุจำนวน Token ที่มากกว่า 0" });
          return;
        }

        if (topUpAmount > quota.remaining) {
          setTopUpResult({
            type: "overQuota",
            message: `เกินโควตาของเจ้าหน้าที่ (คงเหลือ ${formatTokens(quota.remaining)} Token)`,
          });
          return;
        }

        const res = await topUpTokens(cleanCode, topUpAmount, tokenRate);
        if (res.success) {
          setResult(null);
          setTopUpResult({
            type: "success",
            name: res.name,
            ticketCode: res.ticketCode,
            amount: topUpAmount,
            newBalance: res.newBalance,
            bahtAmount,
          });
        } else if (res.error === "ATTENDEE_NOT_FOUND") {
          setResult("invalid");
          setResultName(undefined);
          setResultTicket(cleanCode);
          setTopUpResult(null);
        } else if (res.error === "overQuota") {
          setResult(null);
          setTopUpResult({
            type: "overQuota",
            message: `เกินโควตาของเจ้าหน้าที่ (คงเหลือ ${formatTokens(quota.remaining)} Token)`,
          });
        } else {
          setResult(null);
          setTopUpResult({ type: "error", message: res.message });
          if (res.error === "TOKEN_RATE_CHANGED") refreshRate();
        }
      } finally {
        processing.current = false;
        setIsProcessing(false);
      }
      return;
    }

    try {
      const res = await api.tickets.scan({ qrToken: cleanCode, action: mode });
      if (res.success) {
        const ticket = res.data;
        const outcome: ScanOutcome = mode === "out" ? "checked-out" : "checked-in";
        const fullName = `${ticket.firstName ?? ""} ${ticket.lastName ?? ""}`.trim() || ticket.ticketTypeName || "ผู้เข้าร่วม";
        const tId = ticket.ticketCode;

        setTopUpResult(null);
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

        setTopUpResult(null);
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
        setTopUpResult(null);
        setResult(checkRes.outcome);
        setResultName(checkRes.attendee.name);
        setResultTicket(checkRes.attendee.ticketId);
      } else {
        const isFormatOk = /^TT-\d{6}$/i.test(cleanCode);
        const outcome: ScanOutcome = isFormatOk ? (mode === "out" ? "checked-out" : "checked-in") : "invalid";
        const name = isFormatOk ? "ธนกร วงศ์สกุล" : undefined;

        setTopUpResult(null);
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
      processing.current = false;
      setIsProcessing(false);
    }
  }, [mode, attendees, checkInOrOut, addScan, topUpAmount, quota.remaining, topUpTokens, tokenRate, bahtAmount, topUpResult, refreshRate]);

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
    if (!videoRef.current || result || topUpResult || (mode === "topup" && !tokenRate)) return;

    let scanTimer: NodeJS.Timeout;
    const BarcodeDetectorClass = typeof window !== "undefined" && "BarcodeDetector" in window
      ? (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector
      : null;

    if (BarcodeDetectorClass) {
      try {
        const detector = new BarcodeDetectorClass({ formats: ["qr_code"] });
        scanTimer = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === 4 && !result && !topUpResult) {
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
  }, [mode, tokenRate, result, topUpResult, processCode]);

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
            className="mx-auto mb-4 grid max-w-md grid-cols-3 rounded-lg bg-muted p-1"
          >
            {(
              [
                { value: "in", label: "เช็กอิน", icon: LogIn },
                { value: "out", label: "เช็กเอาท์", icon: LogOut },
                { value: "topup", label: "เติม Token", icon: Coins },
              ] as const
            ).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                disabled={isProcessing}
                onClick={() => {
                  if (value === "topup" && mode !== "topup") refreshRate();
                  setMode(value);
                  setResult(null);
                  setTopUpResult(null);
                }}
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

          {mode === "topup" && (
            <div className="mx-auto mb-4 max-w-md rounded-xl border bg-muted/30 p-3 sm:p-4">
              <span className="text-sm font-medium">จำนวน Token ที่จะเติม</span>
              <div className="mt-2.5 grid grid-cols-4 gap-2">
                {[50, 100, 200, 500].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={topUpAmount === n}
                    disabled={isProcessing}
                    onClick={() => {
                      setTopUpAmount(n);
                      setTopUpResult(null);
                    }}
                    className={cn(
                      "h-10 rounded-lg border text-sm font-medium tabular-nums outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                      topUpAmount === n
                        ? "border-brand bg-brand-soft font-semibold text-brand"
                        : "bg-background hover:bg-muted"
                    )}
                  >
                    +{n}
                  </button>
                ))}
              </div>
              <div className="mt-3 border-t pt-3 text-sm" aria-live="polite">
                {tokenRate !== null && bahtAmount !== null ? (
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                    <span className="text-muted-foreground">1 Token = {baht.format(Number(tokenRate))}</span>
                    <span className="font-semibold tabular-nums">ยอดรับ {baht.format(Number(bahtAmount))}</span>
                  </div>
                ) : rateError ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-destructive">{rateError}</span>
                    <Button type="button" variant="outline" size="sm" onClick={refreshRate}>โหลดอัตราอีกครั้ง</Button>
                  </div>
                ) : <p className="text-muted-foreground">กำลังโหลดอัตรา Token…</p>}
              </div>
            </div>
          )}

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
              onClick={() => {
                setResult(null);
                setTopUpResult(null);
              }}
              disabled={!result && !topUpResult}
            >
              <ScanLine data-icon="inline-start" aria-hidden />
              สแกนต่อ
            </Button>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-xl border bg-background p-4 sm:p-5" aria-live="polite">
            <h2 className="mb-3 font-medium">ผลการสแกน</h2>
            {isProcessing ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                กำลังตรวจสอบข้อมูลบัตรและทำรายการ…
              </div>
            ) : topUpResult?.type === "success" ? (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Coins className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-emerald-950">เติม Token สำเร็จ</h3>
                    <p className="mt-0.5 text-sm text-foreground/80">
                      เติม <strong className="tabular-nums">+{formatTokens(topUpResult.amount)}</strong> Token ให้เรียบร้อยแล้ว
                    </p>
                    <div className="mt-2 text-sm">
                      <p className="font-medium text-foreground">{topUpResult.name}</p>
                      {topUpResult.ticketCode && <p className="font-mono text-xs text-muted-foreground">{topUpResult.ticketCode}</p>}
                      <p className="mt-1 text-sm">ยอดรับ {baht.format(Number(topUpResult.bahtAmount))}</p>
                      <p className="mt-1 text-sm font-medium text-emerald-800">
                        ยอดคงเหลือใหม่:{" "}
                        <strong className="tabular-nums text-foreground">
                          {formatTokens(topUpResult.newBalance)}
                        </strong>{" "}
                        Token
                      </p>
                    </div>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        className="bg-brand text-on-brand hover:bg-brand-hover"
                        onClick={() => {
                          setResult(null);
                          setTopUpResult(null);
                        }}
                      >
                        สแกนคนถัดไป
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : topUpResult?.type === "overQuota" ? (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-brand-soft p-4 sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-on-brand">
                    <TriangleAlert className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold">เกินโควตา Token ของเจ้าหน้าที่</h3>
                    <p className="mt-0.5 text-sm text-foreground/80">{topUpResult.message}</p>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setResult(null);
                          setTopUpResult(null);
                        }}
                      >
                        ลองใหม่
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : topUpResult?.type === "error" ? (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-brand-soft p-4 sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-on-brand">
                    <TriangleAlert className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold">เกิดข้อผิดพลาด</h3>
                    <p className="mt-0.5 text-sm text-foreground/80">{topUpResult.message}</p>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setResult(null);
                          setTopUpResult(null);
                        }}
                      >
                        ลองใหม่
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : result ? (
              <ScanResultCard
                outcome={result}
                name={result === "invalid" ? undefined : resultName}
                ticketId={resultTicket}
              >
                <Button
                  size="sm"
                  className="bg-brand text-on-brand hover:bg-brand-hover"
                  onClick={() => {
                    setResult(null);
                    setTopUpResult(null);
                  }}
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
              <Button type="submit" size="lg" disabled={isProcessing || (mode === "topup" && (!tokenRate || topUpResult?.type === "success"))} className="bg-brand text-on-brand hover:bg-brand-hover">
                {mode === "topup" ? `เติม ${formatTokens(topUpAmount)} Token` : "ตรวจสอบ"}
              </Button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
