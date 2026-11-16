import Content from "@/app/(main)/account/orders/client";
import Error from "@/app/(main)/account/orders/error";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import { ApiResponse, OrderDetail } from "@/lib/api-types";
import { requirePageUser } from "@/server/auth/page-user";
import { headers } from "next/headers";
import { Suspense } from "react";
import { toast } from "sonner";


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
    await requirePageUser(filter ? `/account/orders?status=${filter}` : "/account/orders");
    const cookie = (await headers()).get("cookie") ?? "";
    const baseUrl = process.env.APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
    const [ordersR, eventsR] = await Promise.all([
        fetch(`${baseUrl}/api/orders`, {
            headers: { cookie },
            cache: "no-store",
        }),
        api.events.list(),
    ]);

    const result: ApiResponse<OrderDetail[]> = await ordersR.json();
    if (!result.success) {
        return <Error message={result.error.message} />;
    }

    return <Content filter={filter} orders={result.data} events={eventsR.success ? eventsR.data : []} />;
}