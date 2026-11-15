import { CheckoutEmpty, CheckoutLoading } from "@/components/checkout/checkout-ui";
import { OrderWizard } from "@/components/checkout/order-wizard";
import { requirePageUser } from "@/server/auth/page-user";
import { ApiError } from "@/server/http/errors";
import { checkoutPaymentQr } from "@/server/services/checkout-payment";
import { getEventBySlug, isEventSelling } from "@/server/services/event.service";
import { releaseExpiredOrderHolds } from "@/server/services/order.service";
import { Suspense } from "react";

type Props = {
    searchParams: Promise<{ event?: string | string[] }>;
};

export default function CheckoutPage(props: Props) {
    return <Suspense fallback={<CheckoutLoading />}><CheckoutContent {...props} /></Suspense>;
}

async function CheckoutContent({ searchParams }: Props) {
    const { event: slug } = await searchParams;
    if (typeof slug !== "string" || !slug) return <CheckoutEmpty title="เลือกงานก่อนซื้อบัตร">เปิดหน้ารายละเอียดงานที่คุณสนใจแล้วกดเลือกบัตร</CheckoutEmpty>;

    const user = await requirePageUser(`/checkout?event=${encodeURIComponent(slug)}`);
    let event = await getEventBySlug(slug).catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
    });
    if (!event) return <CheckoutEmpty title="ไม่พบงานที่ต้องการ">เลือกงานอื่นจากรายการงานทั้งหมด</CheckoutEmpty>;
    if (!isEventSelling(event)) {
        return <CheckoutEmpty title="ยังไม่เปิดขายบัตรในตอนนี้">ดูวันเปิดและปิดจำหน่ายได้จากหน้ารายละเอียดงาน</CheckoutEmpty>;
    }
    if (await releaseExpiredOrderHolds({ eventId: event.id })) event = await getEventBySlug(slug);

    return <OrderWizard key={event.id} event={event} paymentConfigured={Boolean(checkoutPaymentQr())} profile={{
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
    }} />;
}
