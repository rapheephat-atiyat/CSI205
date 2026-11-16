"use client";

import { api } from "@/lib/api-client";
import type { EventDetail, OrderShippingInput, OrderSouvenirItem, TicketAttendeeInput } from "@/lib/api-types";
import { souvenirVariantKey, ticketCanReceiveSouvenir } from "@/lib/souvenirs";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import BookLayout from "./BookLayout";
import { BookSummary } from "./BookSummary";
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
    const [currentStep, setCurrentStep] = useState(1);
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

    const souvenirItems: OrderSouvenirItem[] = [];
    for (const souvenir of souvenirs) {
        const unitPrice = souvenir.extraPrice;
        if (!unitPrice || Number(unitPrice) <= 0) continue;
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
        setCurrentStep(stepNumber);
        document.getElementById("book-step-heading")?.focus({ preventScroll: true });
        window.scrollTo(0, 0);
    }

    async function submitCurrentStep(formEvent: FormEvent<HTMLFormElement>) {
        formEvent.preventDefault();
        if (submittingOrder.current || !hasEnoughTickets) return;

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
        setErrorMessage(order.error.message);
        setIsSubmitting(false);
        submittingOrder.current = false;
    }

    return (
        <BookLayout step={currentStep} event={event} onStep={bookingIsLocked ? undefined : goToStep}>
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
                    onBack={() => goToStep(currentStep - 1)}
                />
            </form>
        </BookLayout>
    );
}
