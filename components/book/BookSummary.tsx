import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { EventTicketItem } from "@/lib/api-types";
import { ArrowLeft, ArrowRight, Check, Circle, Clock3, Info, LockKeyhole, Ticket } from "lucide-react";
import type { AttendeeProgress } from "./attendee-fields";
import { BookCard, money } from "./BookUI";

const nextButtonLabels = [
    "กรอกข้อมูลผู้เข้าร่วม",
    "เลือกของที่ระลึก",
    "ตรวจสอบคำสั่งซื้อ",
    "ไปหน้าชำระเงิน",
];

type Props = {
    currentStep: number;
    attendeeProgress?: AttendeeProgress[];
    completedAttendeeCount: number;
    selectedTicketTypes: EventTicketItem[];
    quantityByTicketId: Record<string, number>;
    ticketCount: number;
    extraSouvenirCount: number;
    extraSouvenirTotal: number;
    shippingFee: number | null;
    orderTotal: number;
    minimumTickets: number;
    maximumTickets: number;
    hasTicketTypes: boolean;
    canConfirmOrder: boolean;
    isSubmitting: boolean;
    mustRetrySameOrder: boolean;
    errorMessage: string;
    onBack: () => void;
};

const attendeeStatuses = {
    complete: { label: "ครบ", icon: Check },
    incomplete: { label: "ยังไม่ครบ", icon: Clock3 },
    empty: { label: "ยังไม่ได้กรอก", icon: Circle },
};

export function BookSummary({
    currentStep, attendeeProgress, completedAttendeeCount, selectedTicketTypes, quantityByTicketId, ticketCount, extraSouvenirCount,
    extraSouvenirTotal, shippingFee, orderTotal, minimumTickets, maximumTickets, hasTicketTypes,
    canConfirmOrder, isSubmitting, mustRetrySameOrder, errorMessage, onBack,
}: Props) {
    const isReviewStep = currentStep === 4;
    const hasEnoughTickets = ticketCount >= minimumTickets;
    const hasIncompleteAttendees = attendeeProgress !== undefined && completedAttendeeCount < ticketCount;
    const canContinue = hasEnoughTickets && !hasIncompleteAttendees && (!isReviewStep || canConfirmOrder);

    let buttonLabel = nextButtonLabels[currentStep - 1];
    if (isSubmitting) {
        buttonLabel = "กำลังบันทึกคำสั่งซื้อ…";
    } else if (mustRetrySameOrder) {
        buttonLabel = "ลองยืนยันอีกครั้ง";
    } else if (isReviewStep && orderTotal === 0) {
        buttonLabel = "ยืนยันคำสั่งซื้อ";
    }

    return (
        <aside className="lg:sticky lg:top-[calc(var(--navbar-height)+1.5rem)]">
            <BookCard title={attendeeProgress ? "ความคืบหน้า" : "สรุปรายการ"}>
                {attendeeProgress ? (
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <p className="flex justify-between gap-3 text-sm" aria-live="polite">
                                <span className="text-muted-foreground">กรอกครบแล้ว</span>
                                <strong className="tabular-nums">{completedAttendeeCount} / {ticketCount} ใบ</strong>
                            </p>
                            <Progress
                                className="h-2"
                                aria-label="ความคืบหน้าการกรอกข้อมูลผู้เข้าร่วม"
                                max={Math.max(ticketCount, 1)}
                                value={completedAttendeeCount}
                                getValueLabel={(value, max) => `${value} จาก ${max} ใบ`}
                            />
                        </div>
                        <ol className="max-h-56 space-y-2 overflow-y-auto text-sm">
                            {attendeeProgress.map(({ key, name, status }, index) => {
                                const { label, icon: StatusIcon } = attendeeStatuses[status];
                                return (
                                    <li key={key} className="flex items-start justify-between gap-2">
                                        <span className="flex min-w-0 items-start gap-2">
                                            <StatusIcon aria-hidden="true" className={`mt-0.5 size-4 shrink-0 ${status === "complete" ? "text-brand" : "text-muted-foreground"}`} />
                                            <span className="min-w-0 wrap-anywhere">ใบที่ {index + 1}{name && ` · ${name}`}</span>
                                        </span>
                                        <span className="shrink-0 text-xs leading-5 text-muted-foreground">{label}</span>
                                    </li>
                                );
                            })}
                        </ol>
                    </div>
                ) : ticketCount > 0 ? (
                    <dl className="space-y-3 text-sm">
                        {selectedTicketTypes.map((ticketType) => {
                            const quantity = quantityByTicketId[ticketType.id];
                            return (
                                <div key={ticketType.id} className="flex justify-between gap-4">
                                    <dt className="min-w-0 wrap-anywhere">{ticketType.name} × {quantity}</dt>
                                    <dd className="shrink-0 tabular-nums">{money(Number(ticketType.price) * quantity)}</dd>
                                </div>
                            );
                        })}
                        {extraSouvenirCount > 0 && (
                            <div className="flex justify-between gap-4">
                                <dt>ของที่ระลึกเพิ่ม × {extraSouvenirCount}</dt>
                                <dd className="tabular-nums">{money(extraSouvenirTotal)}</dd>
                            </div>
                        )}
                        {shippingFee !== null && (
                            <div className="flex justify-between gap-4">
                                <dt>ค่าจัดส่ง</dt>
                                <dd className="tabular-nums">{money(shippingFee)}</dd>
                            </div>
                        )}
                    </dl>
                ) : (
                    <p className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Ticket className="size-5 shrink-0" aria-hidden="true" /> ยังไม่ได้เลือกบัตร
                    </p>
                )}
                <Separator />
                <div className="flex items-baseline justify-between gap-3" aria-live="polite">
                    <span className="text-sm font-medium">รวม {ticketCount} ใบ</span>
                    <strong className="text-xl tabular-nums text-brand">{money(orderTotal)}</strong>
                </div>
                {!hasEnoughTickets && hasTicketTypes && (
                    <p className="text-xs text-muted-foreground">
                        เลือกอย่างน้อย {minimumTickets} ใบ และไม่เกิน {maximumTickets} ใบต่อคำสั่งซื้อ
                    </p>
                )}
                {isReviewStep && !canConfirmOrder && (
                    <p role="status" className="text-sm text-muted-foreground">ผู้จัดงานยังไม่ได้ตั้งค่า QR ชำระเงิน</p>
                )}
                {errorMessage && <p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{errorMessage}</p>}
                <Button type="submit" variant="brand" className="h-11 w-full justify-between" disabled={isSubmitting || !canContinue}>
                    {buttonLabel}
                    {isReviewStep ? <LockKeyhole aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
                </Button>
                {currentStep > 1 && (
                    <Button type="button" variant="outline" className="h-10 w-full" onClick={onBack} disabled={isSubmitting || mustRetrySameOrder}>
                        <ArrowLeft aria-hidden="true" /> ย้อนกลับ
                    </Button>
                )}
                {hasIncompleteAttendees && (
                    <p className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Info aria-hidden="true" className="size-4 shrink-0" />
                        กรอกข้อมูลผู้เข้าร่วมให้ครบทุกใบก่อนไปขั้นตอนถัดไป
                    </p>
                )}
            </BookCard>
        </aside>
    );
}
