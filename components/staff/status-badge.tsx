import { CircleCheck, CircleX, Clock, LogOut, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  outcomeLabel,
  statusLabel,
  type AttendeeStatus,
  type ScanOutcome,
} from "@/lib/staff-mock";

const base =
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap";

const statusStyle: Record<AttendeeStatus, { icon: LucideIcon; cls: string }> = {
  "not-arrived": { icon: Clock, cls: "border-border bg-muted text-muted-foreground" },
  "checked-in": { icon: CircleCheck, cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  "checked-out": { icon: LogOut, cls: "border-border bg-secondary text-foreground/80" },
};

export function AttendeeStatusBadge({ status }: { status: AttendeeStatus }) {
  const { icon: Icon, cls } = statusStyle[status];
  return (
    <span className={cn(base, cls)}>
      <Icon className="size-3" aria-hidden />
      {statusLabel[status]}
    </span>
  );
}

const outcomeStyle: Record<ScanOutcome, { icon: LucideIcon; cls: string }> = {
  "checked-in": { icon: CircleCheck, cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  "checked-out": { icon: LogOut, cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  expired: { icon: Clock, cls: "border-amber-200 bg-amber-50 text-amber-900" },
  duplicate: { icon: TriangleAlert, cls: "border-amber-200 bg-amber-50 text-amber-900" },
  invalid: { icon: CircleX, cls: "border-red-200 bg-brand-soft text-brand-hover" },
};

export function OutcomeBadge({ outcome }: { outcome: ScanOutcome }) {
  const { icon: Icon, cls } = outcomeStyle[outcome];
  return (
    <span className={cn(base, cls)}>
      <Icon className="size-3" aria-hidden />
      {outcomeLabel[outcome]}
    </span>
  );
}
