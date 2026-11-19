import ContentLoadError from "@/components/core/ContentLoadError";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { EventSummary } from "@/lib/api-types";
import { getPublicEvents } from "@/server/cache/public-content";
import { ArrowRight, ArrowUpRight, CalendarDays, CircleHelp, MapPin, ReceiptText, Ticket } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "งานอีเวนต์และจองบัตร | TUATUA",
    description: "ดูงานที่กำลังเปิดขายบัตรและกำหนดเปิดขายงานถัดไปบน TUATUA",
};

const timeZone = "Asia/Bangkok";
const saleDate = new Intl.DateTimeFormat("th-TH", { timeZone, day: "numeric", month: "short", year: "numeric" });
const saleDay = new Intl.DateTimeFormat("th-TH", { timeZone, day: "numeric" });
const saleMonth = new Intl.DateTimeFormat("th-TH", { timeZone, month: "short" });
const saleTime = new Intl.DateTimeFormat("th-TH", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

const shortcuts = [
    { href: "/account/tickets", title: "บัตรของฉัน", detail: "เปิด QR สำหรับเข้างาน", icon: Ticket },
    { href: "/account/orders", title: "ประวัติคำสั่งซื้อ", detail: "ติดตามสถานะการชำระเงิน", icon: ReceiptText },
    { href: "/faq", title: "ศูนย์ช่วยเหลือ", detail: "คำถามเรื่องการจองและชำระเงิน", icon: CircleHelp },
] as const;

function eventLink(event: EventSummary) {
    return "/e/" + encodeURIComponent(event.slug);
}

function OpenEventCard({ event, eager }: { event: EventSummary; eager: boolean }) {
    return (
        <Link
            href={eventLink(event)}
            className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border bg-card hover:border-foreground/25 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand motion-safe:transition-[border-color,translate] motion-safe:hover:-translate-y-0.5"
        >
            <div className="relative aspect-video overflow-hidden bg-muted">
                {event.thumbnail ? (
                    <Image
                        src={event.thumbnail}
                        alt=""
                        fill
                        sizes="(min-width: 1280px) 388px, (min-width: 640px) 31vw, 100vw"
                        loading={eager ? "eager" : "lazy"}
                        unoptimized={!event.thumbnail.startsWith("https://images.unsplash.com/")}
                        className="object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="grid size-full place-items-center text-muted-foreground">
                        <Ticket aria-hidden="true" className="size-10 stroke-1" />
                    </div>
                )}
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4 lg:p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-brand">
                    <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
                    <span>ปิดขาย <time dateTime={event.buyEndAt}>{saleDate.format(new Date(event.buyEndAt))}</time></span>
                </div>
                <h2 className="text-xl leading-snug font-semibold wrap-anywhere transition-colors group-hover:text-brand sm:max-lg:text-lg">{event.title}</h2>
                <div className="mt-auto flex min-h-7 items-center justify-between gap-3 text-sm text-muted-foreground">
                    {event.venue ? (
                        <span className="flex min-w-0 items-start gap-2">
                            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                            <span className="wrap-anywhere">{event.venue}</span>
                        </span>
                    ) : <span />}
                    <ArrowUpRight aria-hidden="true" className="size-5 shrink-0 text-foreground transition-colors group-hover:text-brand" />
                </div>
            </div>
        </Link>
    );
}

function UpcomingEvents({ events }: { events: EventSummary[] }) {
    return (
        <section aria-labelledby="upcoming-events-heading" className="min-w-0">
            <h2 id="upcoming-events-heading" className="text-2xl font-semibold sm:text-[1.75rem]">เปิดขายเร็ว ๆ นี้</h2>
            {events.length > 0 ? (
                <ul className="mt-4 divide-y border-y">
                    {events.map((event) => {
                        const opening = new Date(event.buyAt);
                        return (
                            <li key={event.id}>
                                <Link href={eventLink(event)} className="group grid min-h-21 grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3 py-3 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-2 focus-visible:outline-brand sm:gap-4">
                                    <time dateTime={event.buyAt} aria-label={saleDate.format(opening)} className="flex flex-col items-center border-r pr-2 leading-tight">
                                        <span className="text-2xl font-semibold tabular-nums text-brand">{saleDay.format(opening)}</span>
                                        <span className="text-xs font-medium text-muted-foreground">{saleMonth.format(opening)}</span>
                                    </time>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold wrap-anywhere transition-colors group-hover:text-brand">{event.title}</h3>
                                        <p className="mt-0.5 text-sm wrap-anywhere text-muted-foreground">
                                            เปิด {saleTime.format(opening)} น.{event.venue && <> · {event.venue}</>}
                                        </p>
                                    </div>
                                    <ArrowUpRight aria-hidden="true" className="mr-1 size-4 text-muted-foreground transition-colors group-hover:text-brand" />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="mt-4 border-t py-5 text-sm text-muted-foreground">ยังไม่มีกำหนดเปิดขายงานใหม่</p>
            )}
        </section>
    );
}

function AccountShortcuts() {
    return (
        <aside aria-labelledby="home-account-heading" className="self-start rounded-xl border bg-muted/40 p-5 sm:p-6">
            <h2 id="home-account-heading" className="text-xl font-semibold">จัดการบัตรและคำสั่งซื้อ</h2>
            <ul className="mt-2 divide-y">
                {shortcuts.map(({ href, title, detail, icon: Icon }) => (
                    <li key={href}>
                        <Link href={href} className="group grid min-h-18 grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 py-3 focus-visible:outline-2 focus-visible:outline-brand">
                            <span className="grid size-9 place-items-center rounded-lg border bg-background text-brand">
                                <Icon aria-hidden="true" className="size-4" />
                            </span>
                            <span>
                                <span className="block font-medium transition-colors group-hover:text-brand">{title}</span>
                                <span className="block text-sm text-muted-foreground">{detail}</span>
                            </span>
                            <ArrowRight aria-hidden="true" className="size-4 text-muted-foreground transition-colors group-hover:text-brand" />
                        </Link>
                    </li>
                ))}
            </ul>
        </aside>
    );
}

function EventsSkeleton() {
    return (
        <div aria-busy="true" aria-label="กำลังโหลดรายการงาน" className="grid gap-4 sm:grid-cols-3 lg:gap-5">
            {[1, 2, 3].map((index) => (
                <div key={index} className="overflow-hidden rounded-xl border bg-card">
                    <Skeleton className="aspect-video rounded-none motion-reduce:animate-none" />
                    <div className="space-y-3 p-5">
                        <Skeleton className="h-4 w-28 motion-reduce:animate-none" />
                        <Skeleton className="h-6 w-4/5 motion-reduce:animate-none" />
                        <Skeleton className="h-4 w-3/5 motion-reduce:animate-none" />
                    </div>
                </div>
            ))}
        </div>
    );
}

async function EventSections() {
    await connection();
    let events: EventSummary[];
    try {
        events = await getPublicEvents();
    } catch {
        return (
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-8">
                <ContentLoadError message="โหลดข้อมูลงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" />
                <AccountShortcuts />
            </div>
        );
    }

    const now = new Date().getTime();
    const openEvents = events
        .filter((event) => Date.parse(event.buyAt) <= now && now <= Date.parse(event.buyEndAt))
        .sort((first, second) => Date.parse(first.buyEndAt) - Date.parse(second.buyEndAt))
        .slice(0, 3);
    const upcomingEvents = events
        .filter((event) => now < Date.parse(event.buyAt))
        .sort((first, second) => Date.parse(first.buyAt) - Date.parse(second.buyAt))
        .slice(0, 4);

    return (
        <>
            {openEvents.length > 0 ? (
                <ul aria-labelledby="home-events-heading" className="grid gap-4 sm:grid-cols-3 lg:gap-5">
                    {openEvents.map((event, index) => (
                        <li key={event.id} className="min-w-0"><OpenEventCard event={event} eager={index === 0} /></li>
                    ))}
                </ul>
            ) : (
                <p className="rounded-xl border bg-muted/40 px-5 py-8 text-muted-foreground">ตอนนี้ยังไม่มีงานที่เปิดขายบัตร</p>
            )}
            <div className="mt-9 grid items-start gap-7 sm:mt-11 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-8">
                <UpcomingEvents events={upcomingEvents} />
                <AccountShortcuts />
            </div>
        </>
    );
}

export default function Home() {
    return (
        <main lang="th" className="mx-auto w-full max-w-7xl px-4 pt-7 pb-12 sm:px-6 sm:pt-9 sm:pb-16 lg:px-10">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
                <h1 id="home-events-heading" className="text-[1.75rem] leading-tight font-semibold sm:text-4xl">กำลังเปิดขายบัตร</h1>
                <Button asChild variant="outline" className="min-h-11 gap-2">
                    <Link href="/events">ดูงานทั้งหมด <ArrowRight aria-hidden="true" className="size-4" /></Link>
                </Button>
            </div>
            <Suspense fallback={<EventsSkeleton />}>
                <EventSections />
            </Suspense>
        </main>
    );
}
