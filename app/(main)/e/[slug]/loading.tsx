import { Skeleton } from "@/components/ui/skeleton";

export default function EventLoading() {
    return (
        <main className="mx-auto w-full max-w-7xl px-4 pt-6 pb-12 sm:px-6 lg:px-10 lg:pt-8">
            <p role="status" className="sr-only">กำลังโหลดรายละเอียดงาน</p>
            <div aria-hidden="true" className="motion-reduce:[&_[data-slot=skeleton]]:animate-none">
                <div className="mb-8 flex min-h-9 items-center justify-between gap-4">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-9 w-11 sm:w-20" />
                </div>
                <div className="mb-6 max-w-4xl space-y-4">
                    <div className="flex gap-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-9 w-full max-w-xl" />
                    <Skeleton className="h-5 w-2/3 max-w-sm" />
                </div>
                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-10">
                    <div className="min-w-0">
                        <Skeleton className="aspect-video w-full rounded-xl" />
                        <div className="flex gap-2 border-b py-6">
                            <Skeleton className="size-10 shrink-0 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-4 w-3/4 max-w-64" />
                                <Skeleton className="h-4 w-14" />
                            </div>
                        </div>
                        <div className="space-y-3 pt-10">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </div>
                    <div className="rounded-xl border bg-background">
                        <div className="flex items-center justify-between gap-4 border-b border-dashed px-6 py-5">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-3 w-14" />
                        </div>
                        <div className="space-y-6 p-6">
                            <div className="flex items-center justify-between gap-4">
                                <Skeleton className="h-4 w-14" />
                                <Skeleton className="h-7 w-24" />
                            </div>
                            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                            <Skeleton className="h-12 w-full rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
