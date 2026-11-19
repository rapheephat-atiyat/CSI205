import { BookLoading } from "@/components/book/BookLoading";
import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentLoading() {
    return (
        <BookLoading label="กำลังโหลดรายละเอียดการชำระเงิน">
            <div className="grid items-start gap-5 lg:grid-cols-2">
                <div className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-44 max-w-full" />
                    <Skeleton className="h-9 w-28" />
                    <Skeleton className="aspect-square w-56 max-w-full rounded-lg" />
                    <Skeleton className="h-10 w-28 rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
                    <Skeleton className="h-6 w-36" />
                    <div className="space-y-2 rounded-lg border border-dashed p-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                    </div>
                    <Skeleton className="h-11 w-full rounded-lg" />
                    <Skeleton className="h-10 w-28 rounded-lg" />
                </div>
            </div>
        </BookLoading>
    );
}
