import { Button } from "@/components/ui/button";
import type { EventSouvenirItem, OrderShippingInput, OrderSouvenirItem } from "@/lib/api-types";
import { souvenirVariantKey } from "@/lib/souvenirs";
import { BookCard, money } from "./BookUI";
import type { BookingAttendee } from "./booking-types";

type Props = {
    ticketAttendees: BookingAttendee[];
    souvenirItems: OrderSouvenirItem[];
    souvenirs: EventSouvenirItem[];
    hasSouvenir: boolean;
    shippingAddress: OrderShippingInput | null;
    onEditStep: (stepNumber: number) => void;
    isLocked: boolean;
};

export function Step4ReviewOrder({ ticketAttendees, souvenirItems, souvenirs, hasSouvenir, shippingAddress, onEditStep, isLocked }: Props) {
    return (
        <>
            <BookCard title="บัตรและผู้เข้าร่วม">
                {ticketAttendees.map(({ key, ticketType, attendee }, index) => (
                    <div key={key} className="flex flex-wrap justify-between gap-2 rounded-lg border p-3 text-sm">
                        <div className="min-w-0">
                            <p className="font-medium">ใบที่ {index + 1} · {ticketType.name}</p>
                            <p className="text-muted-foreground wrap-anywhere">
                                {[attendee.firstName, attendee.lastName].filter(Boolean).join(" ") || "ไม่ได้ระบุชื่อ"}
                            </p>
                            {attendee.souvenirs?.map(({ souvenirId, size }) => (
                                <p key={souvenirId} className="text-muted-foreground">
                                    รับ {souvenirs.find((souvenir) => souvenir.id === souvenirId)?.name}{size ? ` · ขนาด ${size}` : ""}
                                </p>
                            ))}
                        </div>
                        <span className="font-medium tabular-nums">{money(ticketType.price)}</span>
                    </div>
                ))}
                <Button type="button" variant="outline" disabled={isLocked} onClick={() => onEditStep(2)}>
                    แก้ไขข้อมูลผู้เข้าร่วม
                </Button>
            </BookCard>
            {hasSouvenir && (
                <BookCard title="การรับของที่ระลึก">
                    {souvenirItems.map(({ souvenirId, name, size, quantity }) => (
                        <p key={souvenirVariantKey(souvenirId, size)} className="text-sm">สั่งเพิ่ม · {name}{size ? ` ขนาด ${size}` : ""} × {quantity}</p>
                    ))}
                    <p className="text-sm">{shippingAddress ? "จัดส่งถึงบ้าน" : "รับที่งาน"}</p>
                    {shippingAddress && (
                        <p className="text-sm text-muted-foreground wrap-anywhere">
                            {shippingAddress.recipientName} · {shippingAddress.recipientPhone}
                            <br />
                            {shippingAddress.addressLine} {shippingAddress.subDistrict} {shippingAddress.district}{" "}
                            {shippingAddress.province} {shippingAddress.postalCode}
                        </p>
                    )}
                    <Button type="button" variant="outline" disabled={isLocked} onClick={() => onEditStep(3)}>
                        แก้ไขการรับของ
                    </Button>
                </BookCard>
            )}
        </>
    );
}
