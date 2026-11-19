import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";

export function BookLoading({ label, children }: { label: string; children: ReactNode }) {
    return (
        <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-12 sm:px-6 sm:pt-8 lg:px-10">
            <p role="status" className="sr-only">{label}</p>
            <div aria-hidden="true" className="space-y-6 motion-reduce:[&_[data-slot=skeleton]]:animate-none">
                <div className="space-y-2">
                    <div className="flex h-10 items-center"><Skeleton className="h-4 w-48 max-w-full" /></div>
                    <Skeleton className="h-9 w-40" />
                </div>
                <div className="grid grid-cols-5 gap-1 rounded-xl border bg-card p-3 sm:gap-3 sm:p-4">
                    {[1, 2, 3, 4, 5].map((step) => (
                        <div key={step} className="flex min-h-11 min-w-0 items-center justify-center gap-2 px-1 sm:justify-start">
                            <Skeleton className="size-8 shrink-0 rounded-full" />
                            <Skeleton className="hidden h-3 w-16 sm:block" />
                        </div>
                    ))}
                </div>
                {children}
            </div>
        </main>
    );
}
