import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { FaqCategoryItem } from "@/lib/api-types";
import { getPublishedFaq } from "@/server/services/faq.service";
import FaqClient from "./FaqClient";

export const metadata: Metadata = {
    title: "คำถามที่พบบ่อย - TUATUA",
};

async function FaqContent() {
    await connection();
    let categories: FaqCategoryItem[] = [];
    let loadError = false;
    try {
        categories = await getPublishedFaq();
    } catch {
        loadError = true;
    }
    return <FaqClient categories={categories} loadError={loadError} />;
}

function FaqSkeleton() {
    return (
        <div role="status" aria-label="กำลังโหลดคำถามที่พบบ่อย" className="space-y-10">
            <Skeleton className="h-14 w-full max-w-2xl motion-reduce:animate-none" />
            <div className="grid gap-8 md:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
                <div className="space-y-3">
                    {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-12 w-full motion-reduce:animate-none" />)}
                </div>
                <div className="space-y-5">
                    <Skeleton className="h-7 w-40 motion-reduce:animate-none" />
                    {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-16 w-full motion-reduce:animate-none" />)}
                </div>
            </div>
        </div>
    );
}

export default function FaqPage() {
    return (
        <main lang="th" className="mx-auto w-full max-w-7xl flex-1 px-4 pt-10 pb-16 sm:px-6 sm:pt-14 lg:px-10 lg:pt-16 lg:pb-24">
            <header className="mb-8 max-w-2xl sm:mb-10">
                <p className="mb-3 text-xs font-medium tracking-widest text-brand">ศูนย์ช่วยเหลือ TUATUA</p>
                <h1 className="text-3xl leading-tight font-medium tracking-tight text-balance sm:text-4xl lg:text-5xl">คำถามที่พบบ่อย</h1>
                <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">ตั้งแต่จองบัตรจนถึงวันเข้างาน ค้นหาคำตอบที่ต้องการได้ที่นี่</p>
            </header>
            <Suspense fallback={<FaqSkeleton />}>
                <FaqContent />
            </Suspense>
        </main>
    );
}
