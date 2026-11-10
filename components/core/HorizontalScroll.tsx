"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface HorizontalScrollProps {
    children: React.ReactNode;
    className?: string;
    trackClassName?: string;
}

export default function HorizontalScroll({
    children,
    className,
    trackClassName,
}: HorizontalScrollProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollState = useCallback(() => {
        const el = trackRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 1);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []);

    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;

        updateScrollState();
        const observer = new ResizeObserver(updateScrollState);
        observer.observe(el);

        return () => observer.disconnect();
    }, [updateScrollState]);

    const scrollByDirection = (direction: -1 | 1) => {
        const el = trackRef.current;
        if (!el) return;
        const distance = Math.max(el.clientWidth * 0.75, 240) * direction;
        el.scrollBy({ left: distance, behavior: "smooth" });
    };

    return (
        <div className={cn("relative min-w-0", className)}>
            <div
                ref={trackRef}
                onScroll={updateScrollState}
                className={cn(
                    "flex snap-x snap-proximity gap-4 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                    trackClassName,
                )}
            >
                {children}
            </div>

            <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="เลื่อนไปทางซ้าย"
                disabled={!canScrollLeft}
                onClick={() => scrollByDirection(-1)}
                className="absolute inset-y-0 left-2 my-auto rounded-full shadow-xs"
            >
                <ChevronLeft />
            </Button>

            <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="เลื่อนไปทางขวา"
                disabled={!canScrollRight}
                onClick={() => scrollByDirection(1)}
                className="absolute inset-y-0 right-2 my-auto rounded-full shadow-xs"
            >
                <ChevronRight />
            </Button>
        </div>
    );
}
