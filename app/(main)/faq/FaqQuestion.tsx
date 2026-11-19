import Link from "next/link";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import type { FaqQuestionItem } from "@/lib/api-types";

interface FaqQuestionProps {
    item: FaqQuestionItem;
    categoryName: string;
    showCategory: boolean;
}

export default function FaqQuestion({ item, categoryName, showCategory }: FaqQuestionProps) {
    const href = item.linkHref;
    const safeLink = href && !href.includes("\\") && (/^\/(?!\/)/.test(href) || /^https?:\/\//i.test(href));

    return (
        <details className="group border-b border-border/60">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 rounded-sm py-5 outline-none hover:text-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0">
                    {showCategory && <span className="mb-1.5 block text-xs font-normal text-muted-foreground">{categoryName}</span>}
                    <span className="block text-sm leading-7 font-medium wrap-break-word sm:text-base">{item.question}</span>
                </span>
                <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-open:rotate-180 group-open:text-brand motion-reduce:transition-none" />
            </summary>
            <div className="pr-4 pb-6 sm:pr-10">
                <p className="text-sm leading-7 whitespace-pre-wrap text-muted-foreground wrap-anywhere">{item.answer}</p>
                {href && safeLink && item.linkLabel && (
                    <Link href={href} prefetch={false} target={href.startsWith("/") ? undefined : "_blank"} rel={href.startsWith("/") ? undefined : "noopener noreferrer"} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-medium text-brand underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
                        {item.linkLabel}<ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
                        {!href.startsWith("/") && <span className="sr-only">(เปิดแท็บใหม่)</span>}
                    </Link>
                )}
            </div>
        </details>
    );
}
