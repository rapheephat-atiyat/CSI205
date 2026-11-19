import BookContent from "@/components/book/BookContent";
import { requirePageUser } from "@/server/auth/page-user";
import { ApiError } from "@/server/http/errors";
import { hasCheckoutPromptPay } from "@/server/services/checkout-payment";
import { getEventBySlug, isEventSelling } from "@/server/services/event.service";
import { releaseExpiredOrderHolds } from "@/server/services/order.service";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type Props = {
    params: Promise<{ slug: string }>;
};

export default function BookPage({ params }: Props) {
    return (
        <Suspense fallback={<div>เดี่ยวมาทำ</div>}>
            <LoadBookingEvent params={params} />
        </Suspense>
    );
}

async function LoadBookingEvent({ params }: Props) {
    const { slug } = await params;
    const bookingUrl = `/e/${encodeURIComponent(slug)}/book`;
    const user = await requirePageUser(bookingUrl);

    let event;
    try {
        event = await getEventBySlug(slug);
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) notFound();
        throw error;
    }

    if (!isEventSelling(event)) {
        return (
            <div>
                ดูวันเปิดและปิดจำหน่ายได้จากหน้ารายละเอียดงาน
            </div>
        );
    }

    const releasedHolds = await releaseExpiredOrderHolds({ eventId: event.id });
    if (releasedHolds) event = await getEventBySlug(slug);

    return (
        <BookContent
            key={event.id}
            event={event}
            paymentConfigured={hasCheckoutPromptPay()}
            profile={{ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone }}
        />
    );
}
