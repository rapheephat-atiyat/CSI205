import "server-only";
import type { OrderShippingInput, OrderSouvenirInput, OrderSouvenirItem, TicketAttendeeInput } from "@/lib/api-types";
import type { Events, EventTicket } from "@/server/database/entities";
import { ApiError } from "@/server/http/errors";

export function invalidOrder(message: string): never {
    throw new ApiError("VALIDATION_ERROR", message, 422);
}

export function validatePaymentSlip(value: unknown): string {
    if (typeof value !== "string" || value.length > 2_796_240) invalidOrder("ขนาดสลิปต้องไม่เกิน 2 MB");
    const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
    if (!match || match[2].length % 4 !== 0) invalidOrder("กรุณาแนบรูปสลิป PNG หรือ JPEG");
    const bytes = Buffer.from(match[2], "base64");
    const signature = match[1] === "png" ? "89504e470d0a1a0a" : "ffd8ff";
    if (bytes.length > 2 * 1024 * 1024 || !bytes.toString("hex", 0, signature.length / 2).startsWith(signature)) {
        invalidOrder("ไฟล์สลิปไม่ถูกต้องหรือมีขนาดเกิน 2 MB");
    }
    return value;
}

export function validateAttendee(input: TicketAttendeeInput, ticket: EventTicket, event: Events): TicketAttendeeInput {
    if (!input || typeof input !== "object" || Array.isArray(input)) invalidOrder("ข้อมูลผู้เข้าร่วมไม่ถูกต้อง");
    const fields = { firstName: 255, lastName: 255, phone: 10, email: 255, graduationYear: 10 } as const;
    const attendee: TicketAttendeeInput = {};
    for (const key of Object.keys(fields) as (keyof typeof fields)[]) {
        const value = input[key];
        if (value != null && (typeof value !== "string" || value.trim().length > fields[key])) invalidOrder("ข้อมูลผู้เข้าร่วมไม่ถูกต้อง");
        attendee[key] = value?.trim() || null;
        if (ticket.requiredFields.includes(key) && !attendee[key]) invalidOrder("กรุณากรอกข้อมูลผู้เข้าร่วมให้ครบ");
    }
    if (attendee.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendee.email)) invalidOrder("รูปแบบอีเมลไม่ถูกต้อง");
    if (attendee.phone && !/^[0-9]{9,10}$/.test(attendee.phone)) invalidOrder("กรุณากรอกเบอร์โทรผู้เข้าร่วมเป็นตัวเลข 9 หรือ 10 หลัก");
    attendee.receiveSouvenir = event.hasSouvenir && ticket.includesSouvenir && (input.receiveSouvenir === true || !event.souvenirAllowDecline);
    attendee.souvenirSize = attendee.receiveSouvenir ? input.souvenirSize ?? null : null;
    if (attendee.receiveSouvenir && event.souvenirSizes.length && !event.souvenirSizes.includes(attendee.souvenirSize ?? "")) {
        invalidOrder("กรุณาเลือกขนาดของที่ระลึกที่เปิดให้เลือก");
    }
    if (attendee.souvenirSize && !event.souvenirSizes.includes(attendee.souvenirSize)) invalidOrder("ขนาดของที่ระลึกไม่ถูกต้อง");
    return attendee;
}

export function validateShipping(shipping: OrderShippingInput | null | undefined): OrderShippingInput {
    if (!shipping || typeof shipping !== "object") invalidOrder("กรุณากรอกที่อยู่จัดส่งให้ครบ");
    const fields = ["recipientName", "recipientPhone", "addressLine", "subDistrict", "district", "province", "postalCode"] as const;
    for (const field of fields) {
        if (typeof shipping[field] !== "string" || !shipping[field].trim() || shipping[field].trim().length > 100) invalidOrder("กรุณาตรวจสอบที่อยู่จัดส่ง");
    }
    if (!/^[0-9]{5}$/.test(shipping.postalCode.trim()) || !/^[0-9+() -]{8,20}$/.test(shipping.recipientPhone.trim())) invalidOrder("เบอร์โทรหรือรหัสไปรษณีย์ไม่ถูกต้อง");
    return {
        recipientName: shipping.recipientName.trim(),
        recipientPhone: shipping.recipientPhone.trim(),
        addressLine: shipping.addressLine.trim(),
        subDistrict: shipping.subDistrict.trim(),
        district: shipping.district.trim(),
        province: shipping.province.trim(),
        postalCode: shipping.postalCode.trim(),
    };
}

export function priceSouvenirs(input: OrderSouvenirInput[] | undefined, event: Events): OrderSouvenirItem[] {
    if (input === undefined) return [];
    if (!Array.isArray(input) || input.length > 10) invalidOrder("รายการของที่ระลึกไม่ถูกต้อง");
    if (input.length === 0) return [];
    const unitPrice = event.souvenirPrice;
    if (!event.hasSouvenir || !unitPrice || Number(unitPrice) <= 0) invalidOrder("งานนี้ยังไม่เปิดให้สั่งของที่ระลึกเพิ่ม");
    const sizes = new Set<string>();
    let total = 0;
    return input.map((item) => {
        if (!item || !event.souvenirSizes.includes(item.size) || sizes.has(item.size)
            || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || (total += item.quantity) > 10) {
            invalidOrder("กรุณาเลือกขนาดที่เปิดขายและสั่งเพิ่มรวมไม่เกิน 10 ชิ้น");
        }
        sizes.add(item.size);
        return { size: item.size, quantity: item.quantity, unitPrice };
    });
}
