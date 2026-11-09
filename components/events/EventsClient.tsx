"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type EventSummary } from "@/lib/api-types";

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

interface EventsClientProps {
    readonly initialEvents: readonly EventSummary[];
}

export default function EventsClient({ initialEvents }: EventsClientProps) {
    return (
        <div className="flex flex-col gap-6 sm:gap-8">
            {/* Header ส่วนหัวของหน้า */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Link href="/" className="hover:text-foreground transition-colors">
                        หน้าหลัก
                    </Link>
                    <span>/</span>
                    <span className="text-foreground font-medium">งานทั้งหมด</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
                    <div>
                        <h1 className="border-l-6 border-brand pl-2.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            งานทั้งหมด
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            รวมงานกิจกรรม สัมมนา นิทรรศการ และการแสดงทั้งหมดในระบบ
                        </p>
                    </div>

                    <span className="text-xs text-muted-foreground">
                        ทั้งหมด <strong className="text-foreground">{initialEvents.length}</strong> กิจกรรม
                    </span>
                </div>
            </div>

            {/* แสดงการ์ดกิจกรรมทั้งหมด */}
            {initialEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {initialEvents.map((event) => (
                        <Link
                            key={event.id}
                            href={`/event?slug=${encodeURIComponent(event.slug)}`}
                            className="group/card block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <Card
                                size="sm"
                                className="h-full flex flex-col justify-between overflow-hidden pt-0 transition-all duration-200 hover:shadow-md hover:border-foreground/20"
                            >
                                <div>
                                    {/* รูปภาพ Thumbnail */}
                                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                                        {event.thumbnail ? (
                                            <Image
                                                src={event.thumbnail}
                                                alt={event.title}
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                                className="object-cover transition-transform duration-300 group-hover/card:scale-105"
                                                unoptimized={!event.thumbnail.includes("images.unsplash.com")}
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                                ไม่มีรูปภาพ
                                            </div>
                                        )}

                                        {/* ป้ายแท็กหมวดหมู่อันแรก */}
                                        {event.tags && event.tags.length > 0 && (
                                            <span className="absolute bottom-2 left-2 rounded-md bg-background/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-medium text-foreground shadow-xs">
                                                {event.tags[0]}
                                            </span>
                                        )}
                                    </div>

                                    {/* รายละเอียดการ์ด */}
                                    <CardHeader className="pt-3 pb-1">
                                        <CardTitle
                                            className="line-clamp-1 text-sm sm:text-base font-semibold transition-colors group-hover/card:text-brand"
                                            title={event.title}
                                        >
                                            {event.title}
                                        </CardTitle>
                                        {event.subTitle && (
                                            <p className="line-clamp-1 text-xs text-muted-foreground mt-0.5">
                                                {event.subTitle}
                                            </p>
                                        )}
                                    </CardHeader>
                                </div>

                                <CardContent className="pt-2 pb-3 text-xs text-muted-foreground space-y-1.5 border-t border-border/40 mt-2">
                                    <div className="flex items-center gap-1.5 line-clamp-1 text-foreground/80">
                                        <Calendar className="size-3.5 text-brand shrink-0" />
                                        <span>{formatThaiDate(event.buyAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 line-clamp-1">
                                        <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                                        <span title={event.venue}>{event.venue}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
                    ไม่มีงานกิจกรรมในขณะนี้
                </div>
            )}
        </div>
    );
}
