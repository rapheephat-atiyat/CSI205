import { cn } from "@/lib/utils";
import { Check, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";

const BOOKING_STEP_LABELS = ["เลือกบัตร", "ข้อมูลผู้เข้าร่วม", "ของที่ระลึก", "สรุปคำสั่งซื้อ", "ชำระเงิน"];

interface Props {
    step: number;
    event?: { title: string; slug: string },
    onStep?: (step: number) => void;
    children: ReactNode;
}

export default function BookLayout({ step, event, onStep, children }: Props) {
    return (
        <main className="mx-auto w-full space-y-6 max-w-6xl px-4 pt-6 pb-12 sm:px-6 sm:pt-8 lg:px-10">
            <header className="space-y-2">
                <Link href={event ? `/e/${encodeURIComponent(event.slug)}` : '/events'} className="inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground hover:text-brand focus-visible:underline">
                    <ChevronLeft className="size-4" aria-hidden="true" /> {event ? event.title : "งานทั้งหมด"}
                </Link>
                <h1 id="book-step-heading" tabIndex={-1} className="text-3xl font-semibold tracking-tight focus:outline-none">{BOOKING_STEP_LABELS[step - 1]}</h1>
            </header>
            <nav aria-label="ขั้นตอนการสั่งซื้อ" className="rounded-xl border bg-card p-3 sm:p-4">
                <ol className="grid grid-cols-5 gap-1 sm:gap-3">
                    {BOOKING_STEP_LABELS.map((label, index) => {
                        const stepNumber = index + 1;
                        const isCurrentStep = stepNumber === step;
                        const isCompletedStep = stepNumber < step;
                        const content = (
                            <>
                                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold", isCurrentStep && "border-brand bg-brand text-on-brand", isCompletedStep && "border-brand/20 bg-brand-soft text-brand")}>
                                    {isCompletedStep ? <Check className="size-4" aria-hidden="true" /> : stepNumber}
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
