import { CheckoutEmpty, CheckoutLoading } from "@/components/checkout/checkout-ui";
import { OrderPayment } from "@/components/checkout/order-payment";
import { requirePageUser } from "@/server/auth/page-user";
import { ApiError } from "@/server/http/errors";
import { checkoutPaymentQr } from "@/server/services/checkout-payment";
import { getEventById } from "@/server/services/event.service";
import { getMyOrder } from "@/server/services/order.service";
import { Suspense } from "react";

type Props = { params: Promise<{ id: string }> };

export default function CheckoutPaymentPage(props: Props) {
    return <Suspense fallback={<CheckoutLoading />}><PaymentContent {...props} /></Suspense>;
}

async function PaymentContent({ params }: Props) {
    const { id } = await params;
    const user = await requirePageUser(`/checkout/${encodeURIComponent(id)}`);
    const order = await getMyOrder(user.id, id).catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
    });
    if (!order) return <CheckoutEmpty title="ไม่พบคำสั่งซื้อ">ตรวจสอบรายการของคุณได้จากประวัติคำสั่งซื้อ</CheckoutEmpty>;

    const event = await getEventById(order.eventId);
    return <OrderPayment key={order.id} order={order} event={{ title: event.title, slug: event.slug }} paymentQr={checkoutPaymentQr()} />;
}
