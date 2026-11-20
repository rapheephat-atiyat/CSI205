"use client";

import { api } from "@/lib/api-client";
import type { EventDetail, OrderShippingInput, OrderSouvenirItem, TicketAttendeeInput } from "@/lib/api-types";
import { getBookingDays } from "@/lib/booking-days";
import { canBuySouvenirExtra, souvenirVariantKey, ticketCanReceiveSouvenir } from "@/lib/souvenirs";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { getAttendeeStatus, type AttendeeProgress } from "./attendee-fields";
import BookLayout from "./BookLayout";
import { BookSummary } from "./BookSummary";
import { Step0SelectDate } from "./Step0SelectDate";
import { Step1SelectTickets } from "./Step1SelectTickets";
import { Step2AttendeeInfo } from "./Step2AttendeeInfo";
import { Step3Souvenir } from "./Step3Souvenir";
import { Step4ReviewOrder } from "./Step4ReviewOrder";
import type { BookingAttendee } from "./booking-types";

type Props = {
    event: EventDetail;
    profile: TicketAttendeeInput;
    paymentConfigured: boolean;
};

const emptyShippingAddress: OrderShippingInput = {
    recipientName: "",
    recipientPhone: "",
    addressLine: "",
    subDistrict: "",
    district: "",
    province: "",
    postalCode: "",
};

export default function BookContent({ event, profile, paymentConfigured }: Props) {
    const router = useRouter();
    const eventDays = useMemo(() => getBookingDays(event.sessions), [event.sessions]);
    const showDateStep = eventDays.length > 1;
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [step, setStep] = useState(showDateStep ? 0 : 1);
    const attendanceDate = showDateStep
        ? eventDays.find(({ date }) => date === selectedDate)?.date ?? null
        : eventDays[0]?.date ?? null;
    const currentStep = showDateStep ? (attendanceDate ? step : 0) : Math.max(1, step);
    const [quantityByTicketId, setQuantityByTicketId] = useState<Record<string, number>>({});
    const [attendeeByKey, setAttendeeByKey] = useState<Record<string, TicketAttendeeInput>>({});
    const [extraQuantityByVariant, setExtraQuantityByVariant] = useState<Record<string, number>>({});
    const [wantsShipping, setWantsShipping] = useState(false);
    const [shippingAddress, setShippingAddress] = useState(emptyShippingAddress);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mustRetrySameOrder, setMustRetrySameOrder] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const requestId = useRef<string | null>(null);
    const submittingOrder = useRef(false);

    const ticketTypes = (event.tickets ?? []).filter((ticketType) => ticketType.isActive);
    const souvenirs = event.souvenirs ?? [];
    const selectedTicketTypes = ticketTypes.filter((ticketType) => quantityByTicketId[ticketType.id] > 0);
    const ticketAttendees: BookingAttendee[] = [];
    let ticketTotalInSatang = 0;

    for (const ticketType of selectedTicketTypes) {
        const quantity = quantityByTicketId[ticketType.id];
        const includedSouvenirs = souvenirs.filter((souvenir) => ticketCanReceiveSouvenir(souvenir, ticketType.id));
        ticketTotalInSatang += Math.round(Number(ticketType.price) * 100) * quantity;

        for (let ticketIndex = 0; ticketIndex < quantity; ticketIndex++) {
            const key = `${ticketType.id}-${ticketIndex}`;
            const attendee = attendeeByKey[key] ?? {
                souvenirs: includedSouvenirs.map((souvenir) => ({ souvenirId: souvenir.id, size: null })),
            };
            ticketAttendees.push({ key, ticketType, attendee });
        }
    }

    const selectedTicketTypeIds = selectedTicketTypes.map(({ id }) => id);
    const souvenirItems: OrderSouvenirItem[] = [];
    for (const souvenir of souvenirs) {
        if (!canBuySouvenirExtra(souvenir, selectedTicketTypeIds)) continue;
        const unitPrice = souvenir.extraPrice;
        const availableSizes = souvenir.sizes.length ? souvenir.sizes : [null];
        for (const size of availableSizes) {
            const quantity = extraQuantityByVariant[souvenirVariantKey(souvenir.id, size)] ?? 0;
            if (quantity > 0) {
                souvenirItems.push({ souvenirId: souvenir.id, name: souvenir.name, size, quantity, unitPrice });
            }
        }
    }
    const extraSouvenirCount = souvenirItems.reduce((count, item) => count + item.quantity, 0);
    const extraSouvenirTotal = souvenirItems.reduce((total, item) => total + Math.round(Number(item.unitPrice) * 100) * item.quantity, 0) / 100;
    const hasSouvenir = extraSouvenirCount > 0 || ticketAttendees.some(({ attendee }) => attendee.souvenirs?.length);
    const shipToHome = wantsShipping && Boolean(event.allowShipping) && hasSouvenir;
    const shippingFee = shipToHome ? Number(event.shippingFee ?? 0) : 0;
    const orderTotal = ticketTotalInSatang / 100 + extraSouvenirTotal + shippingFee;
    const ticketCount = ticketAttendees.length;
    const attendeeProgress = currentStep === 2 ? ticketAttendees.map<AttendeeProgress>((entry) => ({
        key: entry.key,
        name: [entry.attendee.firstName?.trim(), entry.attendee.lastName?.trim()].filter(Boolean).join(" "),
        status: getAttendeeStatus(entry),
    })) : undefined;
    const completedAttendeeCount = attendeeProgress?.filter(({ status }) => status === "complete").length ?? 0;
    const hasIncompleteAttendees = attendeeProgress !== undefined && completedAttendeeCount < ticketCount;
    const hasEnoughTickets = ticketCount >= Math.max(1, event.minTicketQTY);
    const canConfirmOrder = paymentConfigured || orderTotal === 0;
    const bookingIsLocked = isSubmitting || mustRetrySameOrder;

    function changeTicketQuantity(ticketId: string, quantity: number) {
        setQuantityByTicketId((previous) => ({ ...previous, [ticketId]: quantity }));
    }

    function changeAttendee(attendeeKey: string, attendee: TicketAttendeeInput) {
        setAttendeeByKey((previous) => ({ ...previous, [attendeeKey]: attendee }));
    }

    function changeExtraQuantity(variantKey: string, quantity: number) {
        setExtraQuantityByVariant((previous) => ({ ...previous, [variantKey]: quantity }));
    }

    function goToStep(stepNumber: number) {
        if (submittingOrder.current || mustRetrySameOrder) return;

        setErrorMessage("");
        setStep(stepNumber);
        document.getElementById("book-step-heading")?.focus({ preventScroll: true });
        window.scrollTo(0, 0);
    }

    async function submitCurrentStep(formEvent: FormEvent<HTMLFormElement>) {
        formEvent.preventDefault();
        if (submittingOrder.current || !hasEnoughTickets || hasIncompleteAttendees) return;

        if (currentStep < 4) {
            goToStep(currentStep + 1);
            return;
        }
        if (!canConfirmOrder) return;

        requestId.current ??= crypto.randomUUID();
        submittingOrder.current = true;
        setIsSubmitting(true);
        setErrorMessage("");

        let deliveryMethod: "SHIPPING" | "PICKUP" | "NONE" = "NONE";
        if (shipToHome) {
            deliveryMethod = "SHIPPING";
        } else if (hasSouvenir) {
            deliveryMethod = "PICKUP";
        }

        const order = await api.orders.create({
            requestId: requestId.current,
            eventId: event.id,
            attendanceDate,
            items: selectedTicketTypes.map((ticketType) => ({
                eventTicketId: ticketType.id,
                quantity: quantityByTicketId[ticketType.id],
                attendees: ticketAttendees
                    .filter((entry) => entry.ticketType.id === ticketType.id)
                    .map((entry) => entry.attendee),
            })),
            deliveryMethod,
            shipping: shipToHome ? shippingAddress : null,
            souvenirItems: souvenirItems.map(({ souvenirId, size, quantity }) => ({ souvenirId, size, quantity })),
        });

        if (order.success) {
            router.replace(`/e/${encodeURIComponent(event.slug)}/book/order/${encodeURIComponent(order.data.id)}`);
            return;
        }

        const orderStatusUnknown = ["NETWORK_ERROR", "INTERNAL_ERROR"].includes(order.error.code);
        setMustRetrySameOrder(orderStatusUnknown);
        if (!orderStatusUnknown) requestId.current = null;
        if (order.error.code === "EVENT_DATE_UNAVAILABLE" || order.error.code === "EVENT_DATE_REQUIRED") {
            setSelectedDate(null);
            setStep(0);
            router.refresh();
        }
        setErrorMessage(order.error.message);
        setIsSubmitting(false);
        submittingOrder.current = false;
    }

    if (currentStep === 0) {
        return (
            <BookLayout step={0} event={event} showDateStep>
                <Step0SelectDate
                    days={eventDays}
                    selectedDate={attendanceDate}
                    errorMessage={errorMessage}
                    onDateChange={(date) => {
                        setSelectedDate(date);
                        setErrorMessage("");
                    }}
                    onContinue={() => goToStep(1)}
                />
            </BookLayout>
        );
    }

    return (
        <BookLayout step={currentStep} event={event} showDateStep={showDateStep} onStep={bookingIsLocked ? undefined : goToStep}>
            <form onSubmit={submitCurrentStep} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="min-w-0 space-y-5">
                    {currentStep === 1 && (
                        <Step1SelectTickets
                            event={event}
                            ticketTypes={ticketTypes}
                            quantityByTicketId={quantityByTicketId}
                            ticketCount={ticketCount}
                            onQuantityChange={changeTicketQuantity}
                        />
                    )}
                    {currentStep === 2 && (
                        <Step2AttendeeInfo ticketAttendees={ticketAttendees} profile={profile} onAttendeeChange={changeAttendee} />
                    )}
                    {currentStep === 3 && (
                        <Step3Souvenir
                            event={event}
                            ticketAttendees={ticketAttendees}
                            onAttendeeChange={changeAttendee}
                            extraQuantityByVariant={extraQuantityByVariant}
                            extraSouvenirCount={extraSouvenirCount}
                            hasSouvenir={hasSouvenir}
                            onExtraQuantityChange={changeExtraQuantity}
                            shipToHome={shipToHome}
                            onDeliveryChange={setWantsShipping}
                            shippingAddress={shippingAddress}
                            onShippingChange={setShippingAddress}
                        />
                    )}
                    {currentStep === 4 && (
                        <Step4ReviewOrder
                            ticketAttendees={ticketAttendees}
                            souvenirItems={souvenirItems}
                            souvenirs={souvenirs}
                            hasSouvenir={hasSouvenir}
                            shippingAddress={shipToHome ? shippingAddress : null}
                            onEditStep={goToStep}
                            isLocked={bookingIsLocked}
                        />
                    )}
                </div>
                <BookSummary
                    currentStep={currentStep}
                    attendanceDate={attendanceDate}
                    attendeeProgress={attendeeProgress}
                    completedAttendeeCount={completedAttendeeCount}
                    selectedTicketTypes={selectedTicketTypes}
                    quantityByTicketId={quantityByTicketId}
                    ticketCount={ticketCount}
                    extraSouvenirCount={extraSouvenirCount}
                    extraSouvenirTotal={extraSouvenirTotal}
                    shippingFee={shipToHome ? shippingFee : null}
                    orderTotal={orderTotal}
                    minimumTickets={Math.max(1, event.minTicketQTY)}
                    maximumTickets={event.maxTicketQTY}
                    hasTicketTypes={ticketTypes.length > 0}
                    canConfirmOrder={canConfirmOrder}
                    isSubmitting={isSubmitting}
                    mustRetrySameOrder={mustRetrySameOrder}
                    errorMessage={errorMessage}
                    onBack={currentStep > 1 || showDateStep ? () => goToStep(currentStep - 1) : undefined}
                />
            </form>
        </BookLayout>
    );
}
