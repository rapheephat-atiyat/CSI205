"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CircleAlert, LockKeyhole, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api-client";
import type { EventDetail, OrderShippingInput, TicketAttendeeInput } from "@/lib/api-types";
import { CheckoutFrame, CheckoutPanel, money } from "./checkout-ui";
import { AttendeeForm, emptyShipping, EventSummaryCard, SouvenirForm, TicketQuantity, type AttendeeEntry } from "./checkout-fields";

const nextLabels = ["กรอกข้อมูลผู้เข้าร่วม", "เลือกของที่ระลึก", "ตรวจสอบคำสั่งซื้อ", "ไปหน้าชำระเงิน"];

export function OrderWizard({ event, profile, paymentConfigured }: {
    event: EventDetail;
    profile: TicketAttendeeInput;
    paymentConfigured: boolean;
}) {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [attendees, setAttendees] = useState<Record<string, TicketAttendeeInput>>({});
    const [delivery, setDelivery] = useState(false);
    const [extras, setExtras] = useState<Record<string, number>>({});
    const [shipping, setShipping] = useState<OrderShippingInput>(emptyShipping);
    const [busy, setBusy] = useState(false);
    const [retryOnly, setRetryOnly] = useState(false);
    const [error, setError] = useState("");
    const requestId = useRef<string | null>(null);
    const submitting = useRef(false);
    const types = (event.tickets ?? []).filter((type) => type.isActive);
    const chosen = types.filter((type) => quantities[type.id] > 0);
    const entries = chosen.flatMap((type) => Array.from({ length: quantities[type.id] }, (_, i): AttendeeEntry => {
        const key = `${type.id}-${i}`;
        return { key, type, attendee: attendees[key] ?? { receiveSouvenir: Boolean(event.hasSouvenir && type.includesSouvenir) } };
    }));
    const ticketCount = entries.length;
    const ticketTotal = chosen.reduce((sum, type) => sum + Math.round(Number(type.price) * 100) * quantities[type.id], 0) / 100;
    const souvenirItems = (event.souvenirSizes ?? []).filter((size) => extras[size] > 0).map((size) => ({ size, quantity: extras[size] }));
    const souvenirCount = souvenirItems.reduce((sum, item) => sum + item.quantity, 0);
    const souvenirTotal = souvenirCount * Number(event.souvenirPrice ?? 0);
    const hasSouvenir = souvenirCount > 0 || entries.some(({ attendee }) => attendee.receiveSouvenir);
    const ships = Boolean(delivery && event.allowShipping && hasSouvenir);
    const shippingFee = ships ? Number(event.shippingFee ?? 0) : 0;
    const total = ticketTotal + souvenirTotal + shippingFee;
    const canOrder = paymentConfigured || total === 0;
    const eligible = ticketCount >= event.minTicketQTY && ticketCount > 0;

    function goTo(next: number) {
        if (submitting.current || retryOnly) return;
        setError("");
        setStep(next);
        document.getElementById("checkout-heading")?.focus({ preventScroll: true });
        window.scrollTo(0, 0);
    }

    async function advance(formEvent: FormEvent<HTMLFormElement>) {
        formEvent.preventDefault();
        if (submitting.current || !eligible) return;
        if (step < 3) {
            goTo(step + 1);
            return;
        }
        if (!canOrder) return;
        requestId.current ??= crypto.randomUUID();
        submitting.current = true;
        setBusy(true);
        setError("");
        const result = await api.orders.create({
            requestId: requestId.current,
            eventId: event.id,
            items: chosen.map((type) => ({
                eventTicketId: type.id,
                quantity: quantities[type.id],
                attendees: entries.filter((entry) => entry.type.id === type.id).map((entry) => entry.attendee),
            })),
            deliveryMethod: ships ? "SHIPPING" : hasSouvenir ? "PICKUP" : "NONE",
            shipping: ships ? shipping : null,
            souvenirItems,
        });
        if (!result.success) {
            const uncertain = ["NETWORK_ERROR", "INTERNAL_ERROR"].includes(result.error.code);
            setRetryOnly(uncertain);
            if (!uncertain) requestId.current = null;
            setError(result.error.message);
            setBusy(false);
            submitting.current = false;
            return;
        }
        router.replace(`/checkout/${result.data.id}`);
    }

    function changeAttendee(key: string, attendee: TicketAttendeeInput) {
        setAttendees((previous) => ({ ...previous, [key]: attendee }));
    }

    return (
        <CheckoutFrame step={step} event={event} onStep={retryOnly ? undefined : goTo}>
            <form id="checkout-step" className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]" onSubmit={advance}>
                <div className="min-w-0 space-y-5">
                    {step === 0 && <>
                        <EventSummaryCard event={event} />
                        <CheckoutPanel title="เลือกประเภทบัตร">
                            {!types.length && <p role="status" className="text-sm text-muted-foreground">งานนี้ยังไม่มีบัตรที่เปิดขาย</p>}
                            {types.map((type) => <TicketQuantity key={type.id} type={type} quantity={quantities[type.id] ?? 0}
                                limit={Math.max(0, Math.min(type.quota - type.sold, type.maxTicketQTY, event.maxTicketQTY - ticketCount + (quantities[type.id] ?? 0)))}
                                onChange={(quantity) => setQuantities((previous) => ({ ...previous, [type.id]: quantity }))} />)}
                        </CheckoutPanel>
                    </>}
                    {step === 1 && entries.map((entry, index) => <AttendeeForm key={entry.key} entry={entry} index={index}
                        profile={profile} onChange={(value) => changeAttendee(entry.key, value)} />)}
                    {step === 2 && <SouvenirForm event={event} entries={entries} onAttendee={changeAttendee}
                        shipping={shipping} onShipping={setShipping} deliver={ships} onDeliver={setDelivery}
                        extras={extras} onExtras={(size, quantity) => setExtras((previous) => ({ ...previous, [size]: quantity }))} />}
                    {step === 3 && <>
                        <CheckoutPanel title="บัตรและผู้เข้าร่วม">
                            {entries.map(({ key, type, attendee }, index) => <div key={key} className="flex flex-wrap justify-between gap-2 rounded-lg border p-3 text-sm">
                                <div className="min-w-0">
                                    <p className="font-medium">ใบที่ {index + 1} · {type.name}</p>
                                    <p className="text-muted-foreground wrap-anywhere">{[attendee.firstName, attendee.lastName].filter(Boolean).join(" ") || "ไม่ได้ระบุชื่อ"}</p>
                                    {attendee.receiveSouvenir && <p className="text-muted-foreground">รับของที่ระลึก{attendee.souvenirSize ? ` · ขนาด ${attendee.souvenirSize}` : ""}</p>}
                                </div>
                                <span className="font-medium tabular-nums">{money(type.price)}</span>
                            </div>)}
                            <Button type="button" variant="outline" disabled={busy || retryOnly} onClick={() => goTo(1)}>แก้ไขข้อมูลผู้เข้าร่วม</Button>
                        </CheckoutPanel>
                        {hasSouvenir && <CheckoutPanel title="การรับของที่ระลึก">
                            {souvenirItems.map(({ size, quantity }) => <p key={size} className="text-sm">สั่งเพิ่ม · {size} × {quantity}</p>)}
                            <p className="text-sm">{ships ? "จัดส่งถึงบ้าน" : "รับที่งาน"}</p>
                            {ships && <p className="text-sm text-muted-foreground wrap-anywhere">{shipping.recipientName} · {shipping.recipientPhone} · {shipping.addressLine} {shipping.subDistrict} {shipping.district} {shipping.province} {shipping.postalCode}</p>}
                            <Button type="button" variant="outline" disabled={busy || retryOnly} onClick={() => goTo(2)}>แก้ไขการรับของ</Button>
                        </CheckoutPanel>}
                    </>}
                </div>
                <aside className="lg:sticky lg:top-[calc(var(--navbar-height)+1.5rem)]">
                    <CheckoutPanel title="สรุปรายการ">
                        {ticketCount ? <dl className="space-y-3 text-sm">
                            {chosen.map((type) => <div key={type.id} className="flex justify-between gap-4">
                                <dt className="min-w-0 wrap-anywhere">{type.name} × {quantities[type.id]}</dt>
                                <dd className="shrink-0 tabular-nums">{money(Number(type.price) * quantities[type.id])}</dd>
                            </div>)}
                            {souvenirCount > 0 && <div className="flex justify-between gap-4"><dt>ของที่ระลึกเพิ่ม × {souvenirCount}</dt><dd className="tabular-nums">{money(souvenirTotal)}</dd></div>}
                            {ships && <div className="flex justify-between gap-4"><dt>ค่าจัดส่ง</dt><dd className="tabular-nums">{money(shippingFee)}</dd></div>}
                        </dl> : <div className="flex items-center gap-3 text-sm text-muted-foreground"><Ticket className="size-5 shrink-0" aria-hidden="true" /> ยังไม่ได้เลือกบัตร</div>}
                        <Separator />
                        <div className="flex items-baseline justify-between gap-3" aria-live="polite">
                            <span className="text-sm font-medium">รวม {ticketCount} ใบ</span>
                            <strong className="text-xl tabular-nums text-brand">{money(total)}</strong>
                        </div>
                        {!eligible && types.length > 0 && <p className="text-xs text-muted-foreground">เลือกอย่างน้อย {Math.max(1, event.minTicketQTY)} ใบ และไม่เกิน {event.maxTicketQTY} ใบต่อคำสั่งซื้อ</p>}
                        {step === 3 && !canOrder && <p role="status" className="text-sm text-muted-foreground">ผู้จัดงานยังไม่ได้ตั้งค่า QR ชำระเงิน</p>}
                        {error && <p role="alert" className="flex gap-2 rounded-lg border border-destructive/30 p-3 text-sm text-destructive"><CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{error}</p>}
                        <Button type="submit" variant="brand" className="h-11 w-full justify-between" disabled={busy || !eligible || (step === 3 && !canOrder)}>
                            {busy ? "กำลังบันทึกคำสั่งซื้อ…" : retryOnly ? "ลองยืนยันอีกครั้ง" : step === 3 && total === 0 ? "ยืนยันคำสั่งซื้อ" : nextLabels[step]} {step === 3 ? <LockKeyhole /> : <ArrowRight />}
                        </Button>
                        {step > 0 && <Button type="button" variant="outline" className="h-10 w-full" disabled={busy || retryOnly} onClick={() => goTo(step - 1)}><ArrowLeft /> ย้อนกลับ</Button>}
                    </CheckoutPanel>
                </aside>
            </form>
        </CheckoutFrame>
    );
}
