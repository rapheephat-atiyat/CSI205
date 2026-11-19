"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CircleCheck, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/staff/page-header";
import { cn } from "@/lib/utils";
import { attendees as seed, formatTokens } from "@/lib/staff-mock";
import { api } from "@/lib/api-client";
import { useStaff } from "@/components/staff/staff-context";

const presets = [50, 100, 200, 500];

function TokenTopUpContent() {
  const searchParams = useSearchParams();
  const initialAttendeeId = searchParams.get("attendeeId");
  const { attendees: attendeesList, updateAttendeeTokens, setAttendees } = useStaff();

  const [attendeeId, setAttendeeId] = useState(() => initialAttendeeId ?? attendeesList[0]?.id ?? seed[0].id);
  const [amount, setAmount] = useState<number>(100);
  const [custom, setCustom] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<{ name: string; amount: number; balance: number } | null>(null);
  const [balances, setBalances] = useState<Record<string, number>>(() =>
    Object.fromEntries(attendeesList.map((a) => [a.id, a.tokens]))
  );

  useEffect(() => {
    async function loadAttendees() {
      try {
        const res = await api.staff.attendees();
        if (res.success && res.data && res.data.length > 0) {
          const mapped = res.data.map((item) => ({
            id: item.id,
            name: item.name,
            ticketId: item.ticketId,
            ticketType: (item.ticketType as (typeof seed)[0]["ticketType"]) || "ทั่วไป",
            status: item.status,
            tokens: item.tokens,
            lastActionAt: item.lastActionAt,
          }));
          setAttendees(mapped);
          setBalances(Object.fromEntries(mapped.map((a) => [a.id, a.tokens])));
          if (initialAttendeeId && mapped.some((m) => m.id === initialAttendeeId)) {
            setAttendeeId(initialAttendeeId);
          } else {
            setAttendeeId(mapped[0].id);
          }
        }
      } catch {
        // use fallback seed
      }
    }
    loadAttendees();
  }, [initialAttendeeId, setAttendees]);

  const attendee = attendeesList.find((a) => a.id === attendeeId) ?? attendeesList[0] ?? seed[0];
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

  async function confirm() {
    let nextBalance = (balances[attendee.id] ?? 0) + amount;
    try {
      const res = await api.staff.topUp({ attendeeId: attendee.id, amount });
      if (res.success && res.data) {
        nextBalance = res.data.balance;
      }
    } catch {
      // offline / mock fallback
    }

    setBalances((b) => ({ ...b, [attendee.id]: nextBalance }));
    updateAttendeeTokens(attendee.id, nextBalance);
    setDone({ name: attendee.name, amount, balance: nextBalance });
    setConfirming(false);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageHeader
        eyebrow="Staff Token Top-up"
        title="เติม Token ให้ผู้เข้าร่วม"
        description="เติม Token ให้ผู้เข้าร่วมงาน"
      />

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
            {attendeesList.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.ticketId})
              </option>
            ))}
          </select>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Coins className="size-4" aria-hidden />
            ยอดคงเหลือปัจจุบัน
            <span className="font-semibold text-foreground tabular-nums">
              {formatTokens(balances[attendee.id] ?? attendee.tokens ?? 0)}
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
            disabled={invalid}
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
    </div>
  );
}

export default function TokenTopUpPage() {
  return (
    <Suspense fallback={null}>
      <TokenTopUpContent />
    </Suspense>
  );
}
