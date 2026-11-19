import { BookLoading } from "@/components/book/BookLoading";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookingLoading() {
    return (
        <BookLoading label="กำลังโหลดรายการบัตร">
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="min-w-0 space-y-5">
                    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
                        <Skeleton className="aspect-video w-full shrink-0 rounded-lg sm:w-36" />
                        <div className="min-w-0 flex-1 space-y-2">
                            <Skeleton className="h-6 w-full max-w-xs" />
                            <Skeleton className="h-4 w-2/3 max-w-56" />
                            <Skeleton className="h-4 w-1/2 max-w-40" />
                        </div>
                    </div>
                    <div className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
                        <Skeleton className="h-6 w-36" />
                        {[1, 2].map((row) => (
                            <div key={row} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
                                <div className="min-w-0 flex-1 basis-40 space-y-2">
                                    <Skeleton className="h-5 w-3/4 max-w-44" />
                                    <Skeleton className="h-4 w-full max-w-60" />
                                    <Skeleton className="h-3 w-1/2 max-w-24" />
                                </div>
                                <Skeleton className="h-10 w-36" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
                    <Skeleton className="h-6 w-28" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex items-center justify-between gap-3 border-t pt-4">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-6 w-20" />
                    </div>
                    <Skeleton className="h-11 w-full rounded-lg" />
                </div>
            </div>
        </BookLoading>
    );
}
