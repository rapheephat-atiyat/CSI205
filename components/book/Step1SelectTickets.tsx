import { Button } from "@/components/ui/button";
import type { EventDetail, EventTicketItem } from "@/lib/api-types";
import { Minus, Plus } from "lucide-react";
import { BookCard, BookEventDetail, money } from "./BookUI";

type Props = {
    event: EventDetail;
    ticketTypes: EventTicketItem[];
    quantityByTicketId: Record<string, number>;
    ticketCount: number;
    onQuantityChange: (ticketId: string, quantity: number) => void;
};

export function Step1SelectTickets({ event, ticketTypes, quantityByTicketId, ticketCount, onQuantityChange }: Props) {
    return (
        <>
            <BookEventDetail event={event} />
            <BookCard title="เลือกประเภทบัตร">
                {ticketTypes.length === 0 && (
                    <p role="status" className="text-sm text-muted-foreground">งานนี้ยังไม่มีบัตรที่เปิดขาย</p>
                )}
                {ticketTypes.map((ticketType) => {
                    const quantity = quantityByTicketId[ticketType.id] ?? 0;
                    const availableTickets = ticketType.quota - ticketType.sold;
                    const orderLimit = event.maxTicketQTY - ticketCount + quantity;
                    const maximum = Math.max(0, Math.min(availableTickets, ticketType.maxTicketQTY, orderLimit));

                    return (
                        <TicketQuantityPicker
                            key={ticketType.id}
                            ticketType={ticketType}
                            quantity={quantity}
                            maximum={maximum}
                            onQuantityChange={(newQuantity) => onQuantityChange(ticketType.id, newQuantity)}
                        />
                    );
                })}
            </BookCard>
        </>
    );
}

function TicketQuantityPicker({ ticketType, quantity, maximum, onQuantityChange }: {
    ticketType: EventTicketItem;
    quantity: number;
    maximum: number;
    onQuantityChange: (quantity: number) => void;
}) {
    const minimum = Math.max(ticketType.minTicketQTY, 1);
    const quantityAfterMinus = quantity <= minimum ? 0 : quantity - 1;
    const quantityAfterPlus = quantity === 0 ? minimum : quantity + 1;
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
            <div className="min-w-0 flex-1 basis-40 space-y-1">
                <h3 className="font-medium wrap-anywhere">{ticketType.name}</h3>
                {ticketType.description && <p className="text-sm text-muted-foreground wrap-anywhere">{ticketType.description}</p>}
                <p className="text-xs text-muted-foreground">{maximum < minimum && quantity === 0 ? "ยังเลือกบัตรประเภทนี้ไม่ได้" : `เลือกได้ ${minimum} ถึง ${maximum} ใบ`}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold tabular-nums">{money(ticketType.price)} <span className="font-normal text-muted-foreground">/ ใบ</span></span>
                <div className="flex items-center gap-1">
                    <Button type="button" size="icon" variant="outline" className="size-10" disabled={quantity === 0} onClick={() => onQuantityChange(quantityAfterMinus)} aria-label={`ลดจำนวน ${ticketType.name}`}><Minus /></Button>
                    <output className="min-w-8 text-center text-sm font-medium tabular-nums" aria-label={`จำนวน ${ticketType.name}`}>{quantity}</output>
                    <Button type="button" size="icon" variant="outline" className="size-10" disabled={maximum < minimum || quantity >= maximum} onClick={() => onQuantityChange(quantityAfterPlus)} aria-label={`เพิ่มจำนวน ${ticketType.name}`}><Plus /></Button>
                </div>
            </div>
        </div>
    );
}