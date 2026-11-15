import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export const checkoutSteps = ["เลือกบัตร", "ข้อมูลผู้เข้าร่วม", "ของที่ระลึก", "สรุปคำสั่งซื้อ", "ชำระเงิน"];

const currency = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 2 });
export const money = (value: number | string) => currency.format(Number(value));

const dateTime = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" });
export const orderDate = (value: string) => dateTime.format(new Date(value));

export function CheckoutFrame({ step, event, onStep, children }: {
    step: number;
    event?: { title: string; slug: string };
    onStep?: (step: number) => void;
    children: ReactNode;
}) {
    return (
        <main className="mx-auto w-full max-w-6xl space-y-6 px-4 pt-6 pb-12 sm:px-6 sm:pt-8 lg:px-10">
            <header className="space-y-2">
                <Link href={event ? `/e/${encodeURIComponent(event.slug)}` : "/events"} className="inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground hover:text-brand focus-visible:underline">
                    <ChevronLeft className="size-4" aria-hidden="true" />
                    {event ? event.title : "งานทั้งหมด"}
                </Link>
                <h1 id="checkout-heading" tabIndex={-1} className="text-3xl font-semibold tracking-tight focus:outline-none">{checkoutSteps[step]}</h1>
            </header>
            <nav aria-label="ขั้นตอนการสั่งซื้อ" className="rounded-xl border bg-card p-3 sm:p-4">
                <ol className="grid grid-cols-5 gap-1 sm:gap-3">
                    {checkoutSteps.map((label, index) => {
                        const current = index === step;
                        const done = index < step;
                        const content = (
                            <>
                                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold", current && "border-brand bg-brand text-on-brand", done && "border-brand/20 bg-brand-soft text-brand")}>
                                    {done ? <Check className="size-4" aria-hidden="true" /> : index + 1}
                                </span>
                                <span className="hidden text-left text-xs font-medium sm:block lg:text-sm">{label}</span>
                                <span className="sr-only sm:hidden">{label}</span>
                            </>
                        );
                        return (
                            <li key={label} aria-current={current ? "step" : undefined} className="min-w-0">
                                {done && onStep ? (
                                    <button type="button" onClick={() => onStep(index)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-1 hover:bg-muted focus-visible:ring-2 focus-visible:ring-brand sm:justify-start">
                                        {content}
                                    </button>
                                ) : (
                                    <span className={cn("flex min-h-11 items-center justify-center gap-2 rounded-lg px-1 sm:justify-start", current ? "text-foreground" : "text-muted-foreground")}>{content}</span>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>
            {children}
        </main>
    );
}

export function CheckoutPanel({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
    return <section className={cn("min-w-0 space-y-4 rounded-xl border bg-card p-4 sm:p-6", className)}><h2 className="text-lg font-semibold">{title}</h2>{children}</section>;
}

export function CheckoutLoading() {
    return (
        <main aria-busy="true" aria-label="กำลังโหลดข้อมูล" className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-10">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-16 w-full" />
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"><Skeleton className="h-64" /><Skeleton className="h-52" /></div>
        </main>
    );
}

export function CheckoutEmpty({ title, children }: { title: string; children: ReactNode }) {
    return (
        <main className="mx-auto w-full max-w-xl px-4 py-12">
            <CheckoutPanel title={title}>
                <p className="text-sm text-muted-foreground">{children}</p>
                <Button asChild variant="brand" className="h-11"><Link href="/events">ดูงานทั้งหมด</Link></Button>
            </CheckoutPanel>
        </main>
    );
}
