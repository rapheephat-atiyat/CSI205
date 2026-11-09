"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X, Calendar, MapPin, Tag, SlidersHorizontal, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { type EventSummary } from "@/lib/api-types";
import { api } from "@/lib/api-client";
import { FALLBACK_EVENTS } from "@/lib/events-mock";

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

type SortOption = "date-asc" | "date-desc" | "name-asc";

export default function EventsPage() {
    const [events, setEvents] = React.useState<EventSummary[]>([]);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [searchQuery, setSearchQuery] = React.useState<string>("");
    const [selectedTag, setSelectedTag] = React.useState<string>("ทั้งหมด");
    const [sortBy, setSortBy] = React.useState<SortOption>("date-asc");

    // โหลดข้อมูลจาก API (และมี fallback หาก offline หรือ database ยังไม่ได้เชื่อมต่อ)
    React.useEffect(() => {
        let isMounted = true;
        async function loadEvents() {
            setLoading(true);
            try {
                const res = await api.events.list();
                if (isMounted) {
                    if (res.success && res.data && res.data.length > 0) {
                        setEvents(res.data);
                    } else {
                        // Fallback เป็นรายการ mock 20 งานจริงของระบบ
                        setEvents([...FALLBACK_EVENTS]);
                    }
                }
            } catch {
                if (isMounted) {
                    setEvents([...FALLBACK_EVENTS]);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }
        loadEvents();
        return () => {
            isMounted = false;
        };
    }, []);

    // ดึงแท็กทั้งหมดที่มีในงานแบบ unique
    const allTags = React.useMemo(() => {
        const tagsSet = new Set<string>();
        events.forEach((ev) => {
            if (Array.isArray(ev.tags)) {
                ev.tags.forEach((t) => tagsSet.add(t));
            }
        });
        return ["ทั้งหมด", ...Array.from(tagsSet)];
    }, [events]);

    // กรองและเรียงลำดับ
    const filteredEvents = React.useMemo(() => {
        return events
            .filter((ev) => {
                // ค้นหาจาก ชื่องาน, คำโปรย, สถานที่ หรือแท็ก
                const query = searchQuery.trim().toLowerCase();
                const matchQuery =
                    !query ||
                    ev.title.toLowerCase().includes(query) ||
                    (ev.subTitle && ev.subTitle.toLowerCase().includes(query)) ||
                    (ev.venue && ev.venue.toLowerCase().includes(query)) ||
                    (ev.tags && ev.tags.some((t) => t.toLowerCase().includes(query)));

                // กรองตามแท็กหมวดหมู่
                const matchTag =
                    selectedTag === "ทั้งหมด" || (ev.tags && ev.tags.includes(selectedTag));

                return matchQuery && matchTag;
            })
            .sort((a, b) => {
                if (sortBy === "date-asc") {
                    return new Date(a.buyAt).getTime() - new Date(b.buyAt).getTime();
                }
                if (sortBy === "date-desc") {
                    return new Date(b.buyAt).getTime() - new Date(a.buyAt).getTime();
                }
                if (sortBy === "name-asc") {
                    return a.title.localeCompare(b.title, "th");
                }
                return 0;
            });
    }, [events, searchQuery, selectedTag, sortBy]);

    return (
        <div className="m-5 xl:mx-0">
            <div className="container mx-auto flex max-w-7xl flex-col gap-6 sm:gap-8">
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

                        {!loading && (
                            <span className="text-xs text-muted-foreground">
                                พบทั้งหมด <strong className="text-foreground">{filteredEvents.length}</strong> กิจกรรม
                            </span>
                        )}
                    </div>
                </div>

                {/* แถบเครื่องมือค้นหาและฟิลเตอร์ */}
                <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {/* ช่องค้นหา */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="ค้นหาชื่องาน, สถานที่จัด, หรือคำค้นหา..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-8 h-10 w-full"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:text-foreground"
                                    aria-label="ล้างคำค้นหา"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>

                        {/* ตัวเลือกการเรียงลำดับ */}
                        <div className="flex items-center gap-2 shrink-0">
                            <SlidersHorizontal className="size-4 text-muted-foreground hidden sm:block" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="h-10 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                            >
                                <option value="date-asc">เรียงตาม: วันที่จัดงาน (เร็วที่สุด)</option>
                                <option value="date-desc">เรียงตาม: วันที่จัดงาน (หลังสุด)</option>
                                <option value="name-asc">เรียงตาม: ตัวอักษร (ก-ฮ)</option>
                            </select>
                        </div>
                    </div>

                    {/* หมวดหมู่ / แท็ก (Categories) */}
                    {allTags.length > 1 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                            <span className="text-muted-foreground shrink-0 flex items-center gap-1 mr-1">
                                <Tag className="size-3.5" /> หมวดหมู่:
                            </span>
                            {allTags.map((tag) => {
                                const isSelected = selectedTag === tag;
                                return (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => setSelectedTag(tag)}
                                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                                            isSelected
                                                ? "bg-brand text-on-brand shadow-xs"
                                                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* รายการการ์ดอีเวนต์ทั้งหมด */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-2.5 rounded-xl border bg-card p-3">
                                <Skeleton className="aspect-video w-full rounded-lg" />
                                <Skeleton className="h-4 w-3/4 mt-1" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : filteredEvents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {filteredEvents.map((event) => (
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
                    /* สถานะไม่พบข้อมูล (Empty State) */
                    <div className="rounded-2xl border border-dashed p-12 text-center flex flex-col items-center justify-center gap-3">
                        <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <Search className="size-6" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-base font-semibold text-foreground">
                                ไม่พบงานกิจกรรมที่คุณค้นหา
                            </p>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองหมวดหมู่อื่นเพื่อค้นหากิจกรรมที่สนใจ
                            </p>
                        </div>
                        {(searchQuery || selectedTag !== "ทั้งหมด") && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSearchQuery("");
                                    setSelectedTag("ทั้งหมด");
                                }}
                                className="mt-2 text-xs"
                            >
                                <RefreshCw className="size-3.5 mr-1.5" />
                                ล้างตัวกรองทั้งหมด
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
