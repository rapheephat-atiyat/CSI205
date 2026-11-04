import HorizontalScroll from "@/components/core/HorizontalScroll";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "cn";
import Image from "next/image";

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

export default function Home() {
    return (
        <div className="m-5 xl:mx-0">
            <div className="container mx-auto max-w-7xl outline outline-red-500 flex flex-col gap-5">
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

                <section className="min-w-0 space-y-3">
                    <h2 className="border-l-6 border-brand pl-2 text-lg font-semibold">
                        งานกำลังเปิดขาย
                    </h2>
                    <HorizontalScroll>
                        {[1, 2, 3, 4, 5, 6].map((item) => (
                            <Card key={item} className="w-64 shrink-0 snap-start pt-0 sm:w-72">
                                <div className="aspect-video bg-muted" />
                                <CardHeader>
                                    <CardTitle className="line-clamp-1">ชื่องานตัวอย่าง #{item}</CardTitle>
                                </CardHeader>
                                <CardContent className="text-xs text-muted-foreground">
                                    ส. 20 ธ.ค. 2569 · หอประชุมใหญ่
                                </CardContent>
                            </Card>
                        ))}
                    </HorizontalScroll>
                </section>
                <section className="min-w-0 space-y-3">
                    <h2 className="border-l-6 border-brand pl-2 text-lg font-semibold">
                        งานใกล้เปิดขาย
                    </h2>
                    <HorizontalScroll>
                        {[1, 2, 3, 4, 5, 6].map((item) => (
                            <Card key={item} className="w-64 shrink-0 snap-start pt-0 sm:w-72">
                                <div className="aspect-video bg-muted" />
                                <CardHeader>
                                    <CardTitle className="line-clamp-1">ชื่องานตัวอย่าง #{item}</CardTitle>
                                </CardHeader>
                                <CardContent className="text-xs text-muted-foreground">
                                    ส. 20 ธ.ค. 2569 · หอประชุมใหญ่
                                </CardContent>
                            </Card>
                        ))}
                    </HorizontalScroll>
                </section>
            </div>
        </div>
    );
}
