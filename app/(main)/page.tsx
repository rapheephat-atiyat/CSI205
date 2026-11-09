import HorizontalScroll from "@/components/core/HorizontalScroll";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { type EventSummary } from "@/lib/api-types";
import { getEvents } from "@/server/services/event.service";
import { cn } from "cn";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

interface BannerSlide {
    id: string;
    alt: string;
    src: string;
    objectPosition?: string;
}

const BANNERS: readonly BannerSlide[] = [
    {
        id: "concert-stage",
        alt: "บรรยากาศคอนเสิร์ตและแสงสีบนเวที",
        src: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1600&q=80",
        objectPosition: "object-[50%_72%]",
    },
    {
        id: "festival-celebration",
        alt: "งานเทศกาลและปาร์ตี้เฉลิมฉลอง",
        src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&q=80",
        objectPosition: "object-[50%_78%]",
    },
    {
        id: "live-music-crowd",
        alt: "ผู้ชมในฮอลล์แสดงดนตรีสด",
        src: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1600&q=80",
        objectPosition: "object-[50%_52%]",
    },
];

const THAI_DAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."] as const;

function formatThaiDate(dateString: string): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const dayName = THAI_DAYS[date.getDay()];
    const formatted = date.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
    return `${dayName} ${formatted}`;
}

function EventCard({ event }: { event: EventSummary }) {
    return (
        <Link
            href={`/e/${encodeURIComponent(event.slug)}`}
            className="group/card block w-48 shrink-0 snap-start sm:w-56 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <Card size="sm" className="overflow-hidden pt-0 transition-all duration-200 hover:shadow-md hover:border-foreground/20">
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {event.thumbnail ? (
                        <Image
                            src={event.thumbnail}
                            alt={event.title}
                            fill
                            sizes="(max-width: 640px) 192px, 224px"
                            className="object-cover transition-transform duration-300 group-hover/card:scale-105"
                            unoptimized={!event.thumbnail.includes("images.unsplash.com")}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                            ไม่มีรูปภาพ
                        </div>
                    )}
                </div>
                <CardHeader className="pt-2.5 pb-1">
                    <CardTitle
                        className="line-clamp-1 text-sm sm:text-base font-semibold transition-colors group-hover/card:text-brand"
                        title={event.title}
                    >
                        {event.title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pb-2.5 text-xs text-muted-foreground">
                    <p className="line-clamp-1">
                        {formatThaiDate(event.buyAt)} · {event.venue}
                    </p>
                </CardContent>
            </Card>
        </Link>
    );
}

function SectionSkeleton() {
    return (
        <div className="flex gap-4 overflow-hidden p-1">
            {[1, 2, 3, 4, 5].map((item) => (
                <div
                    key={item}
                    className="w-48 shrink-0 space-y-2.5 rounded-xl border bg-card p-2.5 sm:w-56"
                >
                    <Skeleton className="aspect-video w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            ))}
        </div>
    );
}

function EventSectionsSkeleton() {
    return (
        <>
            <section className="min-w-0 space-y-3">
                <h2 className="border-l-6 border-brand pl-2 text-lg font-semibold">
                    งานกำลังเปิดขาย
                </h2>
                <SectionSkeleton />
            </section>
            <section className="min-w-0 space-y-3">
                <h2 className="border-l-6 border-brand pl-2 text-lg font-semibold">
                    งานใกล้เปิดขาย
                </h2>
                <SectionSkeleton />
            </section>
        </>
    );
}

async function EventSections() {
    await connection();
    let events: EventSummary[] = [];
    try {
        events = await getEvents();
    } catch {
        events = [];
    }

    const now = new Date();

    let activeEvents = events.filter((e) => {
        const start = new Date(e.buyAt);
        const end = new Date(e.buyEndAt);
        return start <= now && now <= end;
    });

    const upcomingEvents = events.filter((e) => {
        const start = new Date(e.buyAt);
        return now < start;
    });

    if (activeEvents.length === 0 && upcomingEvents.length === 0 && events.length > 0) {
        activeEvents = events;
    }

    return (
        <>
            <section className="min-w-0 space-y-3">
                <h2 className="border-l-6 border-brand pl-2 text-lg font-semibold">
                    งานกำลังเปิดขาย
                </h2>
                {activeEvents.length > 0 ? (
                    <HorizontalScroll>
                        {activeEvents.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </HorizontalScroll>
                ) : (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                        ไม่มีงานที่กำลังเปิดขายในขณะนี้
                    </div>
                )}
            </section>

            <section className="min-w-0 space-y-3">
                <h2 className="border-l-6 border-brand pl-2 text-lg font-semibold">
                    งานใกล้เปิดขาย
                </h2>
                {upcomingEvents.length > 0 ? (
                    <HorizontalScroll>
                        {upcomingEvents.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </HorizontalScroll>
                ) : (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                        ไม่มีงานที่ใกล้เปิดขายในขณะนี้
                    </div>
                )}
            </section>
        </>
    );
}

export default function Home() {
    return (
        <div className="m-5 xl:mx-0">
            <div className="container mx-auto flex max-w-7xl flex-col gap-5">
                <Carousel opts={{ loop: true }}>
                    <CarouselContent>
                        {BANNERS.map((banner, index) => (
                            <CarouselItem key={banner.id}>
                                <div className="relative h-44 overflow-hidden rounded-xl sm:h-60 lg:h-72">
                                    <Image
                                        src={banner.src}
                                        alt={banner.alt}
                                        fill
                                        preload={index === 0}
                                        sizes="(max-width: 1280px) 100vw, 1280px"
                                        className={cn("object-cover object-center", banner.objectPosition)}
                                    />
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-4" />
                    <CarouselNext className="right-4" />
                </Carousel>

                <Suspense fallback={<EventSectionsSkeleton />}>
                    <EventSections />
                </Suspense>
            </div>
        </div>
    );
}
