"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleHelp, LayoutGrid, Search, X } from "lucide-react";
import { DynamicIcon, iconNames } from "lucide-react/dynamic";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import type { FaqCategoryItem } from "@/lib/api-types";
import { cn } from "@/lib/utils";
import FaqQuestion from "./FaqQuestion";

function CategoryIcon({ name }: { name: string }) {
    const icon = iconNames.find((iconName) => iconName === name);
    return icon
        ? <DynamicIcon name={icon} aria-hidden="true" className="size-4 shrink-0" fallback={() => <CircleHelp aria-hidden="true" className="size-4 shrink-0" />} />
        : <CircleHelp aria-hidden="true" className="size-4 shrink-0" />;
}

interface FaqClientProps {
    categories: FaqCategoryItem[];
    loadError?: boolean;
}

export default function FaqClient({ categories, loadError = false }: FaqClientProps) {
    const [search, setSearch] = useState("");
    const [categoryId, setCategoryId] = useState<string | null>(null);
    const [isRefreshing, startTransition] = useTransition();
    const searchRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const query = search.trim().toLocaleLowerCase();
    const selectedCategory = categories.find((category) => category.id === categoryId);
    const total = categories.reduce((count, category) => count + category.questions.length, 0);
    const results = categories
        .filter((category) => !selectedCategory || category.id === selectedCategory.id)
        .flatMap((category) => category.questions
            .filter((item) => [category.name, item.question, item.answer, ...item.keywords].join(" ").toLocaleLowerCase().includes(query))
            .map((item) => ({ ...item, categoryName: category.name })));

    useEffect(() => {
        if (loadError) toast.error("โหลดคำถามไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", { id: "faq-load-error" });
    }, [loadError]);

    const resetFilters = () => {
        setSearch("");
        setCategoryId(null);
        searchRef.current?.focus();
    };

    return (
        <div>
            <div role="search" className="mb-10 max-w-2xl sm:mb-12">
                <label htmlFor="faq-search" className="sr-only">ค้นหาคำถามที่พบบ่อย</label>
                <InputGroup className="h-14 bg-muted/30 has-[[data-slot=input-group-control]:focus-visible]:border-brand has-[[data-slot=input-group-control]:focus-visible]:ring-brand/20">
                    <InputGroupAddon className="pl-4"><Search aria-hidden="true" className="size-5" /></InputGroupAddon>
                    <InputGroupInput
                        ref={searchRef}
                        id="faq-search"
                        type="search"
                        placeholder="ค้นหา เช่น จองบัตร ชำระเงิน เข้างาน"
                        value={search}
                        disabled={loadError || total === 0}
                        onChange={(event) => { setSearch(event.target.value); setCategoryId(null); }}
                        className="h-full text-sm [&::-webkit-search-cancel-button]:appearance-none"
                    />
                    {search && <InputGroupAddon align="inline-end" className="pr-1">
                        <Button variant="ghost" size="icon" aria-label="ล้างคำค้นหา" onClick={() => { setSearch(""); searchRef.current?.focus(); }} className="size-11"><X aria-hidden="true" /></Button>
                    </InputGroupAddon>}
                </InputGroup>
            </div>

            <div className="grid items-start gap-8 md:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
                <aside className="min-w-0 md:sticky md:top-[calc(var(--navbar-height)+2rem)]">
                    <h2 className="mb-3 text-xs font-medium text-muted-foreground">เลือกหมวดคำถาม</h2>
                    <nav aria-label="หมวดคำถามที่พบบ่อย" className="flex flex-wrap gap-2 md:flex-col md:gap-1">
                        {[{ id: null, name: "ทุกหมวด", icon: null, count: total }, ...categories.map((category) => ({ ...category, count: category.questions.length }))].map((category) => (
                            <Button
                                key={category.id ?? "all"}
                                variant="ghost"
                                aria-pressed={category.id === (selectedCategory?.id ?? null)}
                                disabled={loadError}
                                onClick={() => setCategoryId(category.id)}
                                className={cn("h-auto min-h-11 min-w-0 max-w-full justify-start gap-3 px-3 py-3 text-left font-normal whitespace-normal md:w-full", category.id === (selectedCategory?.id ?? null) && "bg-brand-soft font-medium text-brand hover:bg-brand-soft hover:text-brand")}
                            >
                                {category.icon ? <CategoryIcon name={category.icon} /> : <LayoutGrid aria-hidden="true" className="size-4 shrink-0" />}
                                <span className="min-w-0 wrap-break-word md:flex-1">{category.name}</span>
                                <span className="ml-auto text-xs tabular-nums opacity-70">{category.count}</span>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <section aria-labelledby="faq-results-title" className="min-w-0">
                    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 pb-5">
                        <h2 id="faq-results-title" className="text-xl font-medium tracking-tight">{query ? "ผลการค้นหา" : selectedCategory?.name ?? "คำถามทั้งหมด"}</h2>
                        <p role="status" aria-live="polite" aria-atomic="true" className="text-xs text-muted-foreground tabular-nums">{results.length} คำถาม</p>
                    </div>

                    {loadError ? (
                        <div role="status" className="rounded-lg bg-muted/30 px-5 py-10 text-center">
                            <CircleHelp aria-hidden="true" className="mx-auto mb-4 size-7 text-muted-foreground" />
                            <h3 className="font-medium">ยังโหลดคำถามไม่ได้</h3>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">ลองโหลดอีกครั้งเพื่อดูคำตอบที่คุณต้องการ</p>
                            <Button variant="brand" disabled={isRefreshing} onClick={() => startTransition(() => router.refresh())} className="mt-5 min-h-11 px-5">{isRefreshing ? "กำลังโหลด..." : "ลองใหม่"}</Button>
                        </div>
                    ) : results.length > 0 ? (
                        <div>{results.map((question) => <FaqQuestion key={question.id} item={question} categoryName={question.categoryName} showCategory={!selectedCategory} />)}</div>
                    ) : (
                        <div className="rounded-lg bg-muted/30 px-5 py-10 text-center">
                            <Search aria-hidden="true" className="mx-auto mb-4 size-7 text-muted-foreground" />
                            <h3 className="font-medium">{total === 0 ? "กำลังเตรียมคำตอบให้คุณ" : "ไม่พบคำถามที่ตรงกัน"}</h3>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{total === 0 ? "คำถามที่พบบ่อยจะปรากฏที่นี่เมื่อมีการเผยแพร่" : "ลองใช้คำค้นอื่น หรือเลือกดูคำถามจากทุกหมวด"}</p>
                            {total > 0 && <Button variant="outline" onClick={resetFilters} className="mt-5 min-h-11 px-5">ดูคำถามทั้งหมด</Button>}
                        </div>
                    )}


                </section>
            </div>
        </div>
    );
}
