"use client";

import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { EventDetail } from "@/lib/api-types";
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, ChevronRight, ImageIcon, MapPin, Share2, Ticket } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ReactNode, useState } from "react";
import { toast } from "sonner";

export default function EventClient({ event, description }: { event: EventDetail, description?: ReactNode }) {
    const [isImageOkay, setIsImageOkay] = useState(true);
    const poster = event.banner || event.thumbnail;
    const activeTickets = event.tickets?.filter((t) => t.isActive) ?? [];
    const minPrice = activeTickets.length > 0 ? Math.min(...activeTickets.map((t) => Number(t.price))) : null;


    async function handleShared() {
        try {
            if (navigator.share) await navigator.share({ title: event.title, url: window.location.href });
            else {
                await navigator.clipboard.writeText(window.location.href);
            }
        } catch (err) {
            if (!(err instanceof DOMException && err.name == "AbortError")) toast.error("เกิดข้อผิดพลาดกรุณาลองอีกครั้ง")
        }
    }
    return (
        <main className="mx-auto w-full max-w-7xl outline outline-red-500 pt-8 px-10 pb-20">
            <div className="mb-8 flex items-center justify-between gap-4 ">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild><Link href="/" className="flex items-center gap-1"><ArrowLeft aria-hidden="true" className="size-4" /> หน้าหลัก</Link></BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild><Link href="/events">งาน</Link></BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{event.title}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <Button className="px-4 min-h-9" onClick={() => handleShared()}>
                    <Share2 aria-hidden="true" className="size-4" />
                    <span className="hidden sm:inline">แชร์</span>
                </Button>
            </div>
            <header className="mb-6 space-y-4 outline outline-red-500 max-w-4xl">
                {event.tags.length > 0 &&
                    <div className="flex flex-wrap gap-2">
                        {event.tags.map((t) => <Badge key={t} variant={"secondary"}>{t}</Badge>)}
                    </div>
                }
                <h1 className="text-3xl leading-tight font-semibold text-balance tracking-tight">{event.title}</h1>
                {event.subTitle &&
                    <p className="outline outline-green-500 max-w-2xl text-base leading-relaxed text-muted-foreground">{event.subTitle}</p>
                }
            </header>
            <div className="flex flex-row items-start gap-10">
                <div className="flex-1 outline-pink-500 outline">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-border/60 bg-muted/40">
                        {poster && isImageOkay ? <Image alt="รูปโปสเตอร์" src={poster} fill priority unoptimized className="object-cover" /> : <div><ImageIcon /></div>}
                    </div>
                    <section className="flex gap-1 border-b border-border/70 py-6">
                        <span className="flex size-10 items-center justify-center rounded-lg text-brand  ">
                            <MapPin aria-hidden="true" className="size-5" strokeWidth={1.5} />
                        </span>
                        <div>
                            <h2 className="mb-1 text-xs text-muted-foreground">
                                สถานที่จัดงาน
                            </h2>
                            <p className="text-sm leading-relaxed font-medium wrap-anywhere">
                                {event.venue || "รอประกาศสถานที่"}
                            </p>
                            {event.venue &&
                                <a className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-sm text-sm text-brand underline-offset-4 hover:underline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}`} target="_blank" >
                                    แผนที่<ArrowUpRight aria-hidden="true" className="size-4" />
                                </a>
                            }
                        </div>
                    </section>
                    <section className="pt-10">
                        {description ?? <p className="whitespace-pre-wrap leading-8 text-muted-foreground">{event.description || "ผู้จัดงานยังไม่ได้เพิ่มรายละเอียด"}</p>}
                    </section>
                </div>
                <aside className="w-84 outline-indigo-500 outline shrink-0 scroll-mt-[calc(var(--navbar-height)+1.5rem)] top-[calc(var(--navbar-height)+2rem)] sticky">
                    <div className="rounded-xl border border-border bg-background">
                        <div className="flex items-center justify-between border-b border-dashed border-border px-6 py-5">
                            <div className="flex items-center gap-2.5">
                                <Ticket aria-hidden="true" className="size-5 text-brand" strokeWidth={1.5} />
                                <h2 id="ticket-heading" className="text-base font-semibold">บัตรเข้าร่วมงาน</h2>
                            </div>
                            <span className="text-xs tracking-widest text-muted-foreground">TUATUA</span>
                        </div>
                        <div className="space-y-6 p-6">
                            <div className="flex items-baseline justify-between">
                                <span className="text-sm text-muted-foreground">ราคาบัตร</span>
                                {minPrice !== null ? (
                                    <div className="text-right">
                                        <span className="text-xs text-muted-foreground mr-1">เริ่มต้น</span>
                                        <span className="text-2xl font-bold text-brand">
                                            {formatPrice(minPrice)}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-sm font-medium text-muted-foreground">รอประกาศราคา</span>
                                )}
                            </div>
                            <div className="rounded-lg bg-muted/50 p-4">
                                <p className="mb-4 flex items-center gap-2 text-sm font-medium">
                                    <CalendarDays aria-hidden="true" className="size-4 text-muted-foreground" strokeWidth={1.5} />
                                    ช่วงเปิดจำหน่าย
                                </p>
                                <dl className="space-y-4 text-sm">
                                    <div>
                                        <dt className="mb-1 text-xs text-muted-foreground">
                                            เริ่มจำหน่าย
                                        </dt>
                                        <dd className="leading-relaxed">
                                            {dateLabel(event.buyAt)}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="mb-1 text-xs text-muted-foreground">
                                            สิ้นสุดการจำหน่าย
                                        </dt>
                                        <dd className="leading-relaxed">
                                            {dateLabel(event.buyEndAt)}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                            <Button asChild variant="brand" className="min-h-12 w-full justify-between px-4 text-sm">
                                <Link href={{ pathname: "/checkout", query: { event: event.slug } }}>
                                    เลือกบัตร
                                    <ArrowRight className="size-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </aside>
            </div >
        </main >
    );
}

function dateLabel(v: string) {
    const date = new Date(v);
    return Number.isNaN(date.getTime() ? "รอประกาศ" : new Intl.DateTimeFormat("th-TH", {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok"
    }).format(date));
}

const formatPrice = (price: number) =>
    new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
        maximumFractionDigits: 0,
    }).format(price);