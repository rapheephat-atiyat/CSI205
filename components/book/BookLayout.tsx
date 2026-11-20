import { cn } from "@/lib/utils";
import { bookingDateLabel } from "@/lib/booking-days";
import { Check, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";

const BOOKING_STEP_LABELS = ["เลือกวันเข้าร่วม", "เลือกบัตร", "ข้อมูลผู้เข้าร่วม", "ของที่ระลึก", "สรุปคำสั่งซื้อ", "ชำระเงิน"];

interface Props {
    step: number;
    event?: { title: string; slug: string; archivedAt?: string | null };
    showDateStep?: boolean;
    attendanceDate?: string | null;
    onStep?: (step: number) => void;
    children: ReactNode;
}

export default function BookLayout({ step, event, showDateStep = false, attendanceDate, onStep, children }: Props) {
    const backLink = event?.archivedAt
        ? { href: "/account/orders", label: "ประวัติคำสั่งซื้อ" }
        : event ? { href: `/e/${encodeURIComponent(event.slug)}`, label: event.title }
            : { href: "/events", label: "งานทั้งหมด" };
    const stepLabels = showDateStep ? BOOKING_STEP_LABELS : BOOKING_STEP_LABELS.slice(1);
    return (
        <main className="mx-auto w-full space-y-6 max-w-6xl px-4 pt-6 pb-12 sm:px-6 sm:pt-8 lg:px-10">
            <header className="space-y-2">
                <Link href={backLink.href} className="inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground hover:text-brand focus-visible:underline">
                    <ChevronLeft className="size-4" aria-hidden="true" /> {backLink.label}
                </Link>
                {event?.archivedAt && <p className="text-sm text-muted-foreground">{event.title}</p>}
                <h1 id="book-step-heading" tabIndex={-1} className="text-3xl font-semibold tracking-tight focus:outline-none">{BOOKING_STEP_LABELS[step]}</h1>
                {attendanceDate && (
                    <p className="text-sm text-muted-foreground">
                        วันที่เข้าร่วม <time dateTime={attendanceDate} className="font-medium text-foreground">{bookingDateLabel(attendanceDate)}</time>
                    </p>
                )}
            </header>
            <nav aria-label="ขั้นตอนการสั่งซื้อ" className="rounded-xl border bg-card p-3 sm:p-4">
                <ol className={cn("grid gap-1 sm:gap-3", showDateStep ? "grid-cols-6" : "grid-cols-5")}>
                    {stepLabels.map((label, index) => {
                        const stepNumber = showDateStep ? index : index + 1;
                        const isCurrentStep = stepNumber === step;
                        const isCompletedStep = stepNumber < step;
                        const content = (
                            <>
                                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold", isCurrentStep && "border-brand bg-brand text-on-brand", isCompletedStep && "border-brand/20 bg-brand-soft text-brand")}>
                                    {isCompletedStep ? <Check className="size-4" aria-hidden="true" /> : index + 1}
                                </span>
                                <span className="hidden text-left text-xs font-medium sm:block lg:text-sm">{label}</span>
                                <span className="sr-only sm:hidden">{label}</span>
                            </>
                        );
                        return (
                            <li key={label} aria-current={isCurrentStep ? "step" : undefined} className="min-w-0">
                                {isCompletedStep && onStep ? (
                                    <button type="button" onClick={() => onStep(stepNumber)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-1 hover:bg-muted focus-visible:ring-2 focus-visible:ring-brand sm:justify-start">
                                        {content}
                                    </button>
                                ) : (
                                    <span className={cn("flex min-h-11 items-center justify-center gap-2 rounded-lg px-1 sm:justify-start", isCurrentStep ? "text-foreground" : "text-muted-foreground")}>{content}</span>
                                )}
                            </li>
                        )
                    })}
                </ol>
            </nav>
            {children}
        </main>
    );
}
