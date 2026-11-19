import Content from "@/app/(main)/account/orders/client";
import Error from "@/app/(main)/account/orders/error";
import { Skeleton } from "@/components/ui/skeleton";
import type { EventSummary, OrderDetail } from "@/lib/api-types";
import { requirePageUser } from "@/server/auth/page-user";
import { getPublicEvents } from "@/server/cache/public-content";
import { getMyOrders } from "@/server/services/order.service";
import { Suspense } from "react";


type Props = { searchParams: Promise<{ status?: string | string[] }> };

const filters = [
    { value: "", label: "ทั้งหมด" },
    { value: "PENDING", label: "รอชำระ / รอตรวจ" },
    { value: "PAID", label: "ชำระแล้ว" },
    { value: "CANCELLED", label: "ยกเลิกแล้ว" },
];

export default function page(props: Props) {
    return (
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <OrdersContent {...props} />
        </Suspense>
    );
}

async function OrdersContent({ searchParams }: Props) {
    const { status } = await searchParams;
    const filter = filters.find((item) => item.value === status)?.value ?? "";
    const user = await requirePageUser(filter ? `/account/orders?status=${filter}` : "/account/orders");
    let orders: OrderDetail[] = [];
    let events: EventSummary[] = [];
    let loadFailed = false;
    try {
        [orders, events] = await Promise.all([
            getMyOrders(user.id),
            getPublicEvents().catch(() => []),
        ]);
    } catch {
        loadFailed = true;
    }
    if (loadFailed) return <Error message="โหลดคำสั่งซื้อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" />;
    return <Content filter={filter} orders={orders} events={events} />;
}
