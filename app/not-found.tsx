import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "404 | TUATUA"
}


export default function NotFound() {
    return (
        <main className="relative isolate flex min-h-[calc(100dvh-var(--navbar-height))] items-center justify-center overflow-hidden px-6 py-16">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-size-[3.5rem_3.5rem] mask-[radial-gradient(ellipse_at_center,black_10%,transparent_65%)]"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-128 -translate-1/2 rounded-full bg-brand/7 blur-3xl"
            />

            <div className="max-w-xl text-center animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both motion-reduce:animate-none">
                <p className="inline-flex items-center gap-2.5 text-[11px] tracking-[0.24em] text-muted-foreground">
                    <span aria-hidden="true" className="h-px w-5 bg-brand" />
                    ERROR 404
                    <span aria-hidden="true" className="h-px w-5 bg-brand" />
                </p>

                <p
                    aria-hidden="true"
                    className="mt-2 select-none text-[8rem] leading-none font-extralight tracking-tighter sm:text-[11rem]"
                >
                    <span className="bg-linear-to-b from-foreground to-foreground/15 bg-clip-text text-transparent">4</span>
                    <span className="bg-linear-to-b from-brand to-brand/25 bg-clip-text text-transparent">0</span>
                    <span className="bg-linear-to-b from-foreground to-foreground/15 bg-clip-text text-transparent">4</span>
                </p>

                <h1 className="mt-4 text-balance text-2xl font-medium tracking-tight sm:text-3xl">
                    ไม่พบหน้าที่คุณกำลังมองหา
                </h1>
                <p className="mx-auto mt-3 max-w-sm text-pretty text-sm leading-7 text-muted-foreground sm:text-base">
                    หน้านี้อาจถูกย้ายหรือไม่มีอยู่แล้ว ลองกลับไปหน้าแรก หรือเลือกดูงานอื่นที่น่าสนใจ
                </p>

                <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Button
                        asChild
                        variant="brand"
                        className="h-11 w-full gap-2 rounded-lg px-6 font-normal sm:w-auto"
                    >
                        <Link href="/">
                            <ArrowLeft
                                aria-hidden="true"
                                strokeWidth={1.5}
                                className="transition-transform group-hover/button:-translate-x-0.5 motion-reduce:transition-none"
                            />
                            กลับหน้าแรก
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        className="h-11 w-full gap-2 rounded-lg px-6 font-normal sm:w-auto"
                    >
                        <Link href="/events">
                            ดูงานทั้งหมด
                            <ArrowRight
                                aria-hidden="true"
                                strokeWidth={1.5}
                                className="transition-transform group-hover/button:translate-x-0.5 motion-reduce:transition-none"
                            />
                        </Link>
                    </Button>
                </div>

                <p className="mt-10 text-xs text-muted-foreground">
                    ต้องการความช่วยเหลือ?{" "}
                    <Link
                        href="/help"
                        className="rounded-sm text-foreground underline decoration-border underline-offset-4 outline-none transition-colors hover:decoration-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 motion-reduce:transition-none"
                    >
                        ไปที่ศูนย์ช่วยเหลือ
                    </Link>
                </p>
            </div>
        </main>
    );
}
