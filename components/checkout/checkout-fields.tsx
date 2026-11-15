import { CheckoutPanel, money, orderDate } from "@/components/checkout/checkout-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EventDetail, EventTicketItem, OrderShippingInput, TicketAttendeeInput } from "@/lib/api-types";
import { CalendarDays, MapPin, Minus, Plus, Shirt, Ticket } from "lucide-react";
import Image from "next/image";
import type { HTMLInputTypeAttribute } from "react";

export type AttendeeEntry = {
    key: string;
    type: EventTicketItem;
    attendee: TicketAttendeeInput;
};

export const emptyShipping: OrderShippingInput = {
    recipientName: "", recipientPhone: "", addressLine: "", subDistrict: "", district: "", province: "", postalCode: "",
};

const attendeeFields = [
    { name: "firstName", label: "ชื่อ", max: 255, autoComplete: "given-name" },
    { name: "lastName", label: "นามสกุล", max: 255, autoComplete: "family-name" },
    { name: "email", label: "อีเมล", type: "email", max: 255, autoComplete: "email" },
    { name: "phone", label: "เบอร์โทรศัพท์", type: "tel", pattern: "[0-9]{9,10}", max: 10, autoComplete: "tel-national" },
    { name: "graduationYear", label: "ปีที่จบ / รุ่น", max: 10 },
] as const satisfies { name: keyof TicketAttendeeInput; label: string; type?: HTMLInputTypeAttribute; pattern?: string; max: number; autoComplete?: string }[];

export function EventSummaryCard({ event }: { event: EventDetail }) {
    return (
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
            <div className="relative flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground sm:w-36">
                {event.thumbnail ? <Image src={event.thumbnail} alt="" fill sizes="(max-width: 639px) 90vw, 144px" unoptimized className="object-cover" /> : <Ticket aria-hidden="true" />}
            </div>
            <div className="min-w-0 space-y-2">
                <h2 className="text-lg font-semibold wrap-anywhere">{event.title}</h2>
                <p className="flex items-start gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{event.venue || "รอประกาศสถานที่"}</p>
                <p className="flex items-start gap-2 text-sm text-muted-foreground"><CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden="true" />ขายถึง {orderDate(event.buyEndAt)} น.</p>
            </div>
        </div>
    );
}

export function TicketQuantity({ type, quantity, limit, onChange }: {
    type: EventTicketItem; quantity: number; limit: number; onChange: (quantity: number) => void;
}) {
    const minimum = Math.max(type.minTicketQTY, 1);
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
            <div className="min-w-0 flex-1 basis-40 space-y-1">
                <h3 className="font-medium wrap-anywhere">{type.name}</h3>
                {type.description && <p className="text-sm text-muted-foreground wrap-anywhere">{type.description}</p>}
                <p className="text-xs text-muted-foreground">{limit < minimum && quantity === 0 ? "ยังเลือกบัตรประเภทนี้ไม่ได้" : `เลือกได้ ${minimum} ถึง ${limit} ใบ`}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold tabular-nums">{money(type.price)} <span className="font-normal text-muted-foreground">/ ใบ</span></span>
                <div className="flex items-center gap-1">
                    <Button type="button" size="icon" variant="outline" className="size-10" disabled={quantity === 0} onClick={() => onChange(quantity <= minimum ? 0 : quantity - 1)} aria-label={`ลดจำนวน ${type.name}`}><Minus /></Button>
                    <output className="min-w-8 text-center text-sm font-medium tabular-nums" aria-label={`จำนวน ${type.name}`}>{quantity}</output>
                    <Button type="button" size="icon" variant="outline" className="size-10" disabled={limit < minimum || quantity >= limit} onClick={() => onChange(quantity ? quantity + 1 : minimum)} aria-label={`เพิ่มจำนวน ${type.name}`}><Plus /></Button>
                </div>
            </div>
        </div>
    );
}

export function AttendeeForm({ entry, index, profile, onChange }: {
    entry: AttendeeEntry; index: number; profile: TicketAttendeeInput; onChange: (value: TicketAttendeeInput) => void;
}) {
    const { key, type, attendee } = entry;
    return (
        <fieldset className="min-w-0 space-y-4 rounded-xl border bg-card p-4 sm:p-6">
            <legend className="px-2 text-base font-semibold">บัตรใบที่ {index + 1}</legend>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="secondary">{type.name}</Badge>
                <Button type="button" variant="outline" className="h-10" onClick={() => onChange({ ...attendee, ...profile })}>ใช้ข้อมูลของฉัน</Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                {attendeeFields.map((field) => {
                    const id = `${key}-${field.name}`;
                    const required = type.requiredFields.includes(field.name);
                    return <div key={id} className="space-y-2">
                        <Label htmlFor={id}>{field.label}{required && <span className="text-brand" aria-hidden="true">*</span>}</Label>
                        <Input
                            id={id} className="h-11" required={required} maxLength={field.max} type={"type" in field ? field.type : "text"}
                            pattern={"pattern" in field ? field.pattern : undefined}
                            autoComplete={"autoComplete" in field ? `section-ticket${index} ${field.autoComplete}` : "off"}
                            value={attendee[field.name] ?? ""} onChange={(event) => onChange({ ...attendee, [field.name]: event.target.value })}
                        />
                    </div>;
                })}
            </div>
        </fieldset>
    );
}

const shippingFields = [
    { name: "recipientName", label: "ชื่อผู้รับ", autoComplete: "name", max: 100 },
    { name: "recipientPhone", label: "เบอร์โทรผู้รับ", autoComplete: "tel", type: "tel", pattern: "[0-9]{9,10}", max: 10 },
    { name: "addressLine", label: "บ้านเลขที่ ถนน หรือซอย", autoComplete: "address-line1", max: 100 },
    { name: "subDistrict", label: "แขวง / ตำบล", autoComplete: "address-level3", max: 100 },
    { name: "district", label: "เขต / อำเภอ", autoComplete: "address-level2", max: 100 },
    { name: "province", label: "จังหวัด", autoComplete: "address-level1", max: 100 },
    { name: "postalCode", label: "รหัสไปรษณีย์", autoComplete: "postal-code", pattern: "[0-9]{5}", max: 5 },
] as const;

export function SouvenirForm({ event, entries, onAttendee, shipping, onShipping, deliver, onDeliver, extras, onExtras }: {
    event: EventDetail; entries: AttendeeEntry[]; onAttendee: (key: string, value: TicketAttendeeInput) => void;
    shipping: OrderShippingInput; onShipping: (value: OrderShippingInput) => void; deliver: boolean; onDeliver: (value: boolean) => void;
    extras: Record<string, number>; onExtras: (size: string, quantity: number) => void;
}) {
    const eligible = entries.filter(({ type }) => type.includesSouvenir && event.hasSouvenir);
    const saleSizes = event.hasSouvenir && event.souvenirPrice ? event.souvenirSizes ?? [] : [];
    const extraCount = saleSizes.reduce((sum, size) => sum + (extras[size] ?? 0), 0);
    if (!eligible.length && !saleSizes.length) return <CheckoutPanel title="ของที่ระลึก"><p className="text-sm text-muted-foreground">บัตรที่เลือกไม่มีของที่ระลึก กดถัดไปเพื่อดูสรุปคำสั่งซื้อ</p></CheckoutPanel>;

    return (
        <>
            <CheckoutPanel title={event.souvenirName || "เลือกของที่ระลึก"}>
                <div className="relative flex aspect-video max-w-xs items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
                    {event.souvenirImage ? <Image src={event.souvenirImage} alt="" fill sizes="320px" unoptimized className="object-cover" /> : <Shirt aria-hidden="true" />}
                </div>
                {eligible.map(({ key, type, attendee }) => (
                    <div key={key} className="grid items-end gap-3 rounded-lg border p-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor={`souvenir-${key}`}>{[attendee.firstName, attendee.lastName].filter(Boolean).join(" ") || type.name}</Label>
                            <select id={`souvenir-${key}`} className="h-11 w-full rounded-lg border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-brand" value={attendee.receiveSouvenir ? "yes" : "no"} onChange={(e) => onAttendee(key, { ...attendee, receiveSouvenir: e.target.value === "yes" })}>
                                <option value="yes">รับของที่ระลึก</option>
                                {event.souvenirAllowDecline !== false && <option value="no">ไม่รับของที่ระลึก</option>}
                            </select>
                        </div>
                        {attendee.receiveSouvenir && Boolean(event.souvenirSizes?.length) && <div className="space-y-2">
                            <Label htmlFor={`size-${key}`}>ขนาดของที่ระลึก</Label>
                            <select id={`size-${key}`} className="h-11 w-full rounded-lg border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-brand" required value={attendee.souvenirSize ?? ""} onChange={(e) => onAttendee(key, { ...attendee, souvenirSize: e.target.value })}>
                                <option value="">เลือกขนาด</option>
                                {event.souvenirSizes?.map((size) => <option key={size} value={size}>{size}</option>)}
                            </select>
                        </div>}
                    </div>
                ))}
                {saleSizes.length > 0 && <fieldset className="space-y-2 rounded-lg border p-4">
                    <legend className="px-2 text-sm font-semibold">สั่งของที่ระลึกเพิ่ม</legend>
                    <p className="text-sm text-muted-foreground">{money(event.souvenirPrice ?? 0)} ต่อชิ้น · สั่งเพิ่มได้รวม 10 ชิ้น</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {saleSizes.map((size) => <div key={size} className="flex items-center justify-between gap-3 rounded-lg border p-2 text-sm">
                            <span className="font-medium wrap-anywhere">{size}</span>
                            <div className="flex shrink-0 items-center gap-1">
                                <Button type="button" size="icon" variant="outline" disabled={!(extras[size] > 0)} onClick={() => onExtras(size, extras[size] - 1)} aria-label={`ลดของที่ระลึกขนาด ${size}`}><Minus /></Button>
                                <output className="min-w-7 text-center tabular-nums" aria-label={`จำนวนของที่ระลึกขนาด ${size}`}>{extras[size] ?? 0}</output>
                                <Button type="button" size="icon" variant="outline" disabled={extraCount >= 10} onClick={() => onExtras(size, (extras[size] ?? 0) + 1)} aria-label={`เพิ่มของที่ระลึกขนาด ${size}`}><Plus /></Button>
                            </div>
                        </div>)}
                    </div>
                </fieldset>}
            </CheckoutPanel>
            {(extraCount > 0 || eligible.some(({ attendee }) => attendee.receiveSouvenir)) && (
                <CheckoutPanel title="วิธีรับของที่ระลึก">
                    <fieldset className="space-y-2">
                        <legend className="sr-only">วิธีรับของที่ระลึก</legend>
                        <label className="flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm">
                            <input type="radio" name="delivery" className="accent-brand" checked={!deliver} onChange={() => onDeliver(false)} /> รับที่งาน
                        </label>
                        {event.allowShipping && <label className="flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm">
                            <input type="radio" name="delivery" className="accent-brand" checked={deliver} onChange={() => onDeliver(true)} /> จัดส่งถึงบ้าน · {money(event.shippingFee ?? 0)}
                        </label>}
                    </fieldset>
                    {deliver && <div className="grid gap-4 sm:grid-cols-2">
                        {shippingFields.map((field) => <div key={field.name} className="space-y-2">
                            <Label htmlFor={field.name}>{field.label}</Label>
                            <Input id={field.name} className="h-11" required maxLength={field.max} type={"type" in field ? field.type : "text"} pattern={"pattern" in field ? field.pattern : undefined}
                                autoComplete={`shipping ${field.autoComplete}`} value={shipping[field.name]} onChange={(e) => onShipping({ ...shipping, [field.name]: e.target.value })} />
                        </div>)}
                    </div>}
                </CheckoutPanel>
            )}
        </>
    );
}
