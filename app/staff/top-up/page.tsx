"use client";

import { useState } from "react";
import { CircleCheck, Coins, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/staff/page-header";
import { cn } from "@/lib/utils";
import { attendees, formatTokens, staffProfile } from "@/lib/staff-mock";

const presets = [50, 100, 200, 500];

export default function TokenTopUpPage() {
  const [attendeeId, setAttendeeId] = useState(attendees[0].id);
  const [amount, setAmount] = useState<number>(100);
  const [custom, setCustom] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<{ name: string; amount: number; balance: number } | null>(null);
  const [used, setUsed] = useState(staffProfile.topUpQuotaUsed);
  const [balances, setBalances] = useState<Record<string, number>>(
    Object.fromEntries(attendees.map((a) => [a.id, a.tokens]))
  );

  const attendee = attendees.find((a) => a.id === attendeeId) ?? attendees[0];
  const quotaLeft = staffProfile.topUpQuotaTotal - used;
  const overQuota = amount > quotaLeft;
  const invalid = !Number.isInteger(amount) || amount <= 0;

  function pickPreset(n: number) {
    setAmount(n);
    setCustom("");
    setConfirming(false);
  }

  function onCustom(v: string) {
    const digits = v.replace(/\D/g, "");
    setCustom(digits);
    setAmount(digits ? Number(digits) : 0);
    setConfirming(false);
  }

  function confirm() {
    const next = balances[attendee.id] + amount;
    setBalances((b) => ({ ...b, [attendee.id]: next }));
    setUsed((u) => u + amount);
    setDone({ name: attendee.name, amount, balance: next });
    setConfirming(false);
  }

  return (
    <>
      <PageHeader
        eyebrow="Staff Token Top-up"
        title="เติม Token ให้ผู้เข้าร่วม"
        description="เติมได้ตามสิทธิ์และโควตาของเจ้าหน้าที่เท่านั้น"
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-xl border bg-background p-4 sm:p-5">
          <div>
            <label htmlFor="topup-attendee" className="text-sm font-medium">ผู้เข้าร่วม</label>
            <select
              id="topup-attendee"
              value={attendeeId}
              onChange={(e) => {
                setAttendeeId(e.target.value);
                setConfirming(false);
                setDone(null);
              }}
              className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {attendees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.ticketId})
                </option>
              ))}
            </select>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Coins className="size-4" aria-hidden />
              ยอดคงเหลือปัจจุบัน
              <span className="font-semibold text-foreground tabular-nums">
                {formatTokens(balances[attendee.id])}
              </span>
              Token
            </p>
          </div>

          <fieldset className="mt-6">
            <legend className="text-sm font-medium">จำนวน Token</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {presets.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={amount === n && !custom}
                  onClick={() => pickPreset(n)}
                  className={cn(
                    "h-11 rounded-lg border text-sm font-medium tabular-nums outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                    amount === n && !custom
                      ? "border-brand bg-brand-soft text-brand"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  +{n}
                </button>
              ))}
            </div>
            <label htmlFor="topup-custom" className="mt-3 block text-xs text-muted-foreground">
              หรือกรอกจำนวนเอง
            </label>
            <input
              id="topup-custom"
              inputMode="numeric"
              value={custom}
              onChange={(e) => onCustom(e.target.value)}
              placeholder="0"
              className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-48"
            />
          </fieldset>

          {overQuota && (
            <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-brand-soft p-3 text-sm">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              เกินโควตาของคุณ เติมได้อีกไม่เกิน {formatTokens(Math.max(quotaLeft, 0))} Token
            </p>
          )}

          {confirming ? (
            <div className="mt-6 rounded-lg border border-brand/30 bg-brand-soft p-4" role="alertdialog" aria-label="ยืนยันการเติม Token">
              <p className="text-sm">
                ยืนยันเติม <strong className="tabular-nums">{formatTokens(amount)}</strong> Token ให้{" "}
                <strong>{attendee.name}</strong>?
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="lg" className="bg-brand text-on-brand hover:bg-brand-hover" onClick={confirm}>
                  ยืนยัน
                </Button>
                <Button size="lg" variant="outline" onClick={() => setConfirming(false)}>
                  ยกเลิก
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="lg"
              className="mt-6 h-11 w-full bg-brand text-base text-on-brand hover:bg-brand-hover sm:w-auto sm:px-8"
              disabled={invalid || overQuota}
              onClick={() => {
                setDone(null);
                setConfirming(true);
              }}
            >
              เติม {invalid ? "" : `${formatTokens(amount)} `}Token
            </Button>
          )}

          {done && (
            <p role="status" className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden />
              เติม {formatTokens(done.amount)} Token ให้ {done.name} สำเร็จ · ยอดใหม่ {formatTokens(done.balance)} Token
            </p>
          )}
        </section>

        <aside className="h-fit rounded-xl border bg-brand-soft p-4 sm:p-5">
          <h2 className="font-medium">โควตาของคุณวันนี้</h2>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{formatTokens(Math.max(quotaLeft, 0))}</p>
          <p className="text-xs text-muted-foreground">
            จาก {formatTokens(staffProfile.topUpQuotaTotal)} Token · ใช้ไปแล้ว {formatTokens(used)}
          </p>
          <div
            role="progressbar"
            aria-label="โควตาที่ใช้ไป"
            aria-valuemin={0}
            aria-valuemax={staffProfile.topUpQuotaTotal}
            aria-valuenow={used}
            className="mt-3 h-2 overflow-hidden rounded-full bg-background"
          >
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${Math.min((used / staffProfile.topUpQuotaTotal) * 100, 100)}%` }}
            />
          </div>
        </aside>
      </div>
    </>
  );
}
