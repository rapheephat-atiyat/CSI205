import type { EventDetail } from "@/lib/api-types";
import { cn } from "@/lib/utils";
import { CalendarDays, MapPin, Ticket } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const currency = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 2 });
export const money = (value: number | string) => currency.format(Number(value));

const dateTime = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" });
export const orderDate = (value: string) => dateTime.format(new Date(value));

export function BookCard({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
    return (
        <section className={cn("min-w-0 space-y-4 rounded-xl border bg-card p-4 sm:p-6", className)}>
            <h2 className="text-lg font-semibold">{title}</h2>
            {children}
        </section>
    );
}

export function BookEventDetail({ event }: { event: EventDetail }) {
    return (
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
            <div className="relative flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground sm:w-36">
                {event.thumbnail ? <Image src={event.thumbnail} alt="" fill sizes="(max-width: 639px) 90vw, 144px" unoptimized className="object-cover" /> : <Ticket aria-hidden="true" />}
            </div>
            <div className="min-w-0 space-y-2">
                <h2 className="text-lg font-semibold wrap-anywhere">{event.title}</h2>
                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {event.venue ? <Link className="underline-offset-4 hover:underline" target="_blank" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}`}>{event.venue}</Link> : "รอประกาศสถานที่"}
                </p>
                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    ขายถึง {orderDate(event.buyEndAt)} น.
                </p>
            </div>
        </div>
    )
}
