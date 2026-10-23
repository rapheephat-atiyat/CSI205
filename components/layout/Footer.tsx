import Brand from "@/components/core/Brand";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

const footerGroups = [
    {
        title: "ค้นหา",
        links: [
            { label: "งานทั้งหมด", href: "/events" },
            { label: "วิธีใช้งาน", href: "/how-it-works" },
        ],
    },
    {
        title: "ให้เราช่วยคุณ",
        links: [
            { label: "ศูนย์ช่วยเหลือ", href: "/help" },
            { label: "บัตรของฉัน", href: "/my-tickets" },
        ],
    },
] as const;

export default async function Footer() {
    "use cache";
    const year = new Date().getFullYear();

    return (
        <footer className="w-full border-t border-border/60 bg-muted/20">
            <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
                <div className="grid gap-10 py-12 sm:py-14 md:grid-cols-[1.4fr_1fr] md:gap-16 lg:py-16">
                    <div>
                        <Brand />
                        <p className="mt-6 text-[1.75rem] leading-[1.3] font-medium tracking-tight sm:text-[2rem]">
                            Back together.
                            <br />
                            <span className="text-muted-foreground">Better than ever.</span>
                        </p>
                        <p className="mt-4 text-sm leading-7 text-muted-foreground">
                            ผู้คน งานที่ชอบ และช่วงเวลาที่มีความหมาย
                        </p>
                    </div>

                    <div className="debug grid grid-cols-2 gap-6 md:pt-3 lg:gap-12">
                        {footerGroups.map(({ title, links }) => (
                            <nav key={title} aria-label={title}>
                                <h2 className="mb-4 text-xs font-normal tracking-wide text-muted-foreground">
                                    {title}
                                </h2>
                                <ul className="space-y-1">
                                    {links.map(({ href, label }) => (
                                        <li key={href}>
                                            <Link
                                                href={href}
                                                prefetch={false}
                                                className="group inline-flex min-h-11 items-center gap-3 rounded-sm py-2 text-sm text-foreground/80 outline-none transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 motion-reduce:transition-none"
                                            >
                                                {label}
                                                <ArrowUpRight
                                                    aria-hidden="true"
                                                    strokeWidth={1.5}
                                                    className="size-3.5 -translate-x-1 text-brand opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:translate-x-0 motion-reduce:transition-none"
                                                />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-border/60 py-6 text-[11px] leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <p>© {year} TUATUA. All rights reserved.</p>
                    <p className="flex items-center gap-2.5 tracking-[0.14em]">
                        <span aria-hidden="true" className="h-px w-5 bg-brand" />
                        GOOD TIMES. GREAT COMPANY.
                    </p>
                </div>
            </div>
        </footer>
    );
}
