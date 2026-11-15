import { CircleCheck, CircleX, Clock, LogOut, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScanOutcome } from "@/lib/staff-mock";

type Meta = {
  icon: LucideIcon;
  title: string;
  message: string;
  tone: string;
  iconTone: string;
};

export const scanResultMeta: Record<ScanOutcome, Meta> = {
  "checked-in": {
    icon: CircleCheck,
    title: "เช็กอินสำเร็จ",
    message: "อนุญาตให้ผู้เข้าร่วมเข้างานได้",
    tone: "border-emerald-200 bg-emerald-50",
    iconTone: "bg-emerald-600 text-white",
  },
  "checked-out": {
    icon: LogOut,
    title: "เช็กเอาท์สำเร็จ",
    message: "บันทึกการออกจากงานเรียบร้อยแล้ว",
    tone: "border-emerald-200 bg-emerald-50",
    iconTone: "bg-emerald-600 text-white",
  },
  expired: {
    icon: Clock,
    title: "QR หมดอายุ",
    message: "QR นี้หมดอายุแล้ว ให้ผู้เข้าร่วมกดรีเฟรช QR ในแอปแล้วสแกนใหม่",
    tone: "border-amber-200 bg-amber-50",
    iconTone: "bg-amber-500 text-white",
  },
  duplicate: {
    icon: TriangleAlert,
    title: "สแกนซ้ำ",
    message: "บัตรนี้ถูกสแกนไปแล้วเมื่อสักครู่ ไม่ต้องสแกนอีกครั้ง",
    tone: "border-amber-200 bg-amber-50",
    iconTone: "bg-amber-500 text-white",
  },
  invalid: {
    icon: CircleX,
    title: "บัตรไม่ถูกต้อง",
    message: "ไม่พบบัตรนี้ในระบบ หรือไม่ใช่บัตรของงานนี้ กรุณาตรวจสอบกับผู้เข้าร่วม",
    tone: "border-red-200 bg-brand-soft",
    iconTone: "bg-brand text-on-brand",
  },
};

export function ScanResultCard({
  outcome,
  name,
  ticketId,
  className,
  children,
}: {
  outcome: ScanOutcome;
  name?: string;
  ticketId?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const { icon: Icon, title, message, tone, iconTone } = scanResultMeta[outcome];
  return (
    <div
      role={outcome === "checked-in" || outcome === "checked-out" ? "status" : "alert"}
      className={cn("rounded-xl border p-4 sm:p-5", tone, className)}
    >
      <div className="flex items-start gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", iconTone)}>
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="mt-0.5 text-sm text-foreground/80">{message}</p>
          {(name || ticketId) && (
            <p className="mt-2 text-sm">
              {name && <span className="font-medium">{name}</span>}
              {ticketId && (
                <span className="ml-2 font-mono text-xs text-muted-foreground">{ticketId}</span>
              )}
            </p>
          )}
          {children && <div className="mt-3 flex flex-wrap gap-2">{children}</div>}
        </div>
      </div>
    </div>
  );
}
