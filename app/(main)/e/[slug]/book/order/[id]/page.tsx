import { Step5Payment } from "@/components/book/Step5Payment";
import { requirePageUser } from "@/server/auth/page-user";
import { ApiError } from "@/server/http/errors";
import { checkoutPaymentQr } from "@/server/services/checkout-payment";
import { getEventBySlug } from "@/server/services/event.service";
import { getMyOrder } from "@/server/services/order.service";
import { notFound } from "next/navigation";
import { connection } from "next/server";

type Props = { params: Promise<{ slug: string; id: string }> };

export default async function BookingOrderPage({ params }: Props) {
    const { slug, id } = await params;
    const path = `/e/${encodeURIComponent(slug)}/book/order/${encodeURIComponent(id)}`;
    await connection();
    const user = await requirePageUser(path);

    const [event, order] = await Promise.all([getEventBySlug(slug), getMyOrder(user.id, id)]).catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 404) notFound();
        throw error;
    });
    if (order.eventId !== event.id) notFound();
    const canPay = order.status === "PENDING" && !order.hasPaymentSlip;
    const paymentQr = canPay ? checkoutPaymentQr(order.total) : null;
    return <Step5Payment order={order} event={event} paymentQr={paymentQr} />;
}
