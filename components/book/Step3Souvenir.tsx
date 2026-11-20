import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EventDetail, OrderShippingInput, TicketAttendeeInput } from "@/lib/api-types";
import { souvenirVariantKey, ticketCanReceiveSouvenir } from "@/lib/souvenirs";
import { Minus, Plus } from "lucide-react";
import { BookCard, money } from "./BookUI";
import { SouvenirPhoto } from "./SouvenirPhoto";
import type { BookingAttendee } from "./booking-types";

const shippingFields = [
    { name: "recipientName", label: "ชื่อผู้รับ", autoComplete: "name", max: 100 },
    { name: "recipientPhone", label: "เบอร์โทรผู้รับ", autoComplete: "tel", type: "tel", pattern: "[0-9]{9,10}", max: 10 },
    { name: "addressLine", label: "บ้านเลขที่ ถนน หรือซอย", autoComplete: "address-line1", max: 100 },
    { name: "subDistrict", label: "แขวง / ตำบล", autoComplete: "address-level3", max: 100 },
    { name: "district", label: "เขต / อำเภอ", autoComplete: "address-level2", max: 100 },
    { name: "province", label: "จังหวัด", autoComplete: "address-level1", max: 100 },
    { name: "postalCode", label: "รหัสไปรษณีย์", autoComplete: "postal-code", pattern: "[0-9]{5}", max: 5 },
] as const;

type Props = {
    event: EventDetail;
    ticketAttendees: BookingAttendee[];
    onAttendeeChange: (attendeeKey: string, attendee: TicketAttendeeInput) => void;
    shippingAddress: OrderShippingInput;
    onShippingChange: (address: OrderShippingInput) => void;
    shipToHome: boolean;
    onDeliveryChange: (shipToHome: boolean) => void;
    extraQuantityByVariant: Record<string, number>;
    extraSouvenirCount: number;
    hasSouvenir: boolean;
    onExtraQuantityChange: (variantKey: string, quantity: number) => void;
};

export function Step3Souvenir({
    event,
    ticketAttendees,
    onAttendeeChange,
    shippingAddress,
    onShippingChange,
    shipToHome,
    onDeliveryChange,
    extraQuantityByVariant,
    extraSouvenirCount,
    hasSouvenir,
    onExtraQuantityChange,
}: Props) {
    const visibleSouvenirs = (event.souvenirs ?? []).filter((souvenir) =>
        Number(souvenir.extraPrice) > 0 || ticketAttendees.some(({ ticketType }) => ticketCanReceiveSouvenir(souvenir, ticketType.id))
    );

    if (visibleSouvenirs.length === 0) {
        return <BookCard title="ของที่ระลึก">
            <p className="text-sm text-muted-foreground">บัตรที่เลือกไม่มีของที่ระลึก กดถัดไปเพื่อดูสรุปคำสั่งซื้อ</p>
        </BookCard>;
    }

    return (
        <>
            {visibleSouvenirs.map((souvenir) => {
                const eligibleAttendees = ticketAttendees.filter(({ ticketType }) => ticketCanReceiveSouvenir(souvenir, ticketType.id));
                const sizesForSale = souvenir.sizes.length ? souvenir.sizes : [null];
                return (
                    <BookCard key={souvenir.id} title={souvenir.name}>
                        <figure className="w-full max-w-xs space-y-1.5">
                            <SouvenirPhoto image={souvenir.image} sizes="(max-width: 383px) 90vw, 320px" className="aspect-[4/3]" />
                            {souvenir.image?.startsWith("/images/demo-souvenirs/") && (
                                <figcaption className="text-xs text-muted-foreground">
                                    <a href="/images/demo-souvenirs/credits.md" className="underline underline-offset-2">ภาพอ้างอิงและเครดิตรูป</a>
                                </figcaption>
                            )}
                        </figure>
                        {eligibleAttendees.map(({ key, ticketType, attendee }) => {
                            const selections = attendee.souvenirs ?? [];
                            const selection = selections.find((item) => item.souvenirId === souvenir.id);
                            const fieldId = `${souvenir.id}-${key}`;
                            const attendeeName = [attendee.firstName, attendee.lastName].filter(Boolean).join(" ") || ticketType.name;

                            function updateSelection(receive: boolean, size: string | null) {
                                const otherSelections = selections.filter((item) => item.souvenirId !== souvenir.id);
                                if (receive) otherSelections.push({ souvenirId: souvenir.id, size });
                                onAttendeeChange(key, { ...attendee, souvenirs: otherSelections });
                            }

                            return (
                                <div key={key} className="grid items-end gap-3 rounded-lg border p-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor={`receive-${fieldId}`}>{attendeeName}</Label>
                                        <select
                                            id={`receive-${fieldId}`}
                                            className="h-11 w-full rounded-lg border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-brand"
                                            value={selection ? "yes" : "no"}
                                            onChange={(e) => updateSelection(e.target.value === "yes", selection?.size ?? null)}
                                        >
                                            <option value="yes">รับของที่ระลึก</option>
                                            {souvenir.allowDecline && <option value="no">ไม่รับของที่ระลึก</option>}
                                        </select>
                                    </div>
                                    {selection && souvenir.sizes.length > 0 && (
                                        <div className="space-y-2">
                                            <Label htmlFor={`size-${fieldId}`}>ขนาดของที่ระลึก</Label>
                                            <select
                                                id={`size-${fieldId}`}
                                                className="h-11 w-full rounded-lg border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-brand"
                                                required
                                                value={selection.size ?? ""}
                                                onChange={(e) => updateSelection(true, e.target.value || null)}
                                            >
                                                <option value="">เลือกขนาด</option>
                                                {souvenir.sizes.map((size) => <option key={size} value={size}>{size}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {souvenir.extraPrice && Number(souvenir.extraPrice) > 0 && (
                            <fieldset className="space-y-2 rounded-lg border p-4">
                                <legend className="px-2 text-sm font-semibold">สั่งเพิ่ม</legend>
                                <p className="text-sm text-muted-foreground">{money(souvenir.extraPrice)} ต่อชิ้น · สั่งเพิ่มรวมได้ 10 ชิ้นต่อคำสั่งซื้อ</p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {sizesForSale.map((size) => {
                                        const variantKey = souvenirVariantKey(souvenir.id, size);
                                        const quantity = extraQuantityByVariant[variantKey] ?? 0;
                                        const itemLabel = size ? `${souvenir.name} ขนาด ${size}` : souvenir.name;
                                        return (
                                            <div key={variantKey} className="flex items-center justify-between gap-3 rounded-lg border p-2 text-sm">
                                                <span className="font-medium wrap-anywhere">{size ?? "จำนวน"}</span>
                                                <div className="flex shrink-0 items-center gap-1">
                                                    <Button type="button" size="icon" variant="outline" disabled={quantity === 0} onClick={() => onExtraQuantityChange(variantKey, quantity - 1)} aria-label={`ลดจำนวน ${itemLabel}`}><Minus /></Button>
                                                    <output className="min-w-7 text-center tabular-nums" aria-label={`จำนวน ${itemLabel}`}>{quantity}</output>
                                                    <Button type="button" size="icon" variant="outline" disabled={extraSouvenirCount >= 10} onClick={() => onExtraQuantityChange(variantKey, quantity + 1)} aria-label={`เพิ่มจำนวน ${itemLabel}`}><Plus /></Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </fieldset>
                        )}
                    </BookCard>
                );
            })}
            {hasSouvenir && (
                <BookCard title="วิธีรับของที่ระลึก">
                    <fieldset className="space-y-2">
                        <legend className="sr-only">วิธีรับของที่ระลึก</legend>
                        <label className="flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm">
                            <input type="radio" name="delivery" className="accent-brand" checked={!shipToHome} onChange={() => onDeliveryChange(false)} /> รับที่งาน
                        </label>
                        {event.allowShipping && <label className="flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm">
                            <input type="radio" name="delivery" className="accent-brand" checked={shipToHome} onChange={() => onDeliveryChange(true)} /> จัดส่งถึงบ้าน · {money(event.shippingFee ?? 0)}
                        </label>}
                    </fieldset>
                    {shipToHome && <div className="grid gap-4 sm:grid-cols-2">
                        {shippingFields.map((field) => <div key={field.name} className="space-y-2">
                            <Label htmlFor={field.name}>{field.label}</Label>
                            <Input id={field.name} className="h-11" required maxLength={field.max} type={"type" in field ? field.type : "text"} pattern={"pattern" in field ? field.pattern : undefined}
                                autoComplete={`shipping ${field.autoComplete}`} value={shippingAddress[field.name]} onChange={(e) => onShippingChange({ ...shippingAddress, [field.name]: e.target.value })} />
                        </div>)}
                    </div>}
                </BookCard>
            )}
        </>
    );
}
