import "server-only";
import type { EventSouvenirItem, OrderShippingInput, OrderSouvenirInput, OrderSouvenirItem, TicketAttendeeInput, TicketSouvenir } from "@/lib/api-types";
import { canBuySouvenirExtra, souvenirVariantKey, ticketCanReceiveSouvenir } from "@/lib/souvenirs";
import type { EventTicket } from "@/server/database/entities";
import { ApiError } from "@/server/http/errors";

export function invalidOrder(message: string): never {
    throw new ApiError("VALIDATION_ERROR", message, 422);
}

export function validatePaymentSlip(value: unknown): string {
    if (typeof value !== "string" || value.length > 2_796_240) invalidOrder("ขนาดสลิปต้องไม่เกิน 2 MB");

    const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
    if (!match || match[2].length % 4 !== 0) invalidOrder("กรุณาแนบรูปสลิป PNG หรือ JPEG");
    const [, fileType, base64] = match;
    const file = Buffer.from(base64, "base64");
    const expectedHeader = fileType === "png" ? "89504e470d0a1a0a" : "ffd8ff";
    const fileHeader = file.toString("hex", 0, expectedHeader.length / 2);
    if (file.length > 2 * 1024 * 1024 || fileHeader !== expectedHeader) {
        invalidOrder("ไฟล์สลิปไม่ถูกต้องหรือมีขนาดเกิน 2 MB");
    }
    return value;
}

export function validateAttendee(input: TicketAttendeeInput, ticketType: EventTicket, eventSouvenirs: EventSouvenirItem[]) {
    if (!input || typeof input !== "object" || Array.isArray(input)) invalidOrder("ข้อมูลผู้เข้าร่วมไม่ถูกต้อง");
    const maxLength = { firstName: 255, lastName: 255, phone: 10, email: 255, graduationYear: 10 };
    const attendee: TicketAttendeeInput = {};
    for (const field of Object.keys(maxLength) as (keyof typeof maxLength)[]) {
        const value = input[field];
        if (value != null && (typeof value !== "string" || value.trim().length > maxLength[field])) {
            invalidOrder("ข้อมูลผู้เข้าร่วมไม่ถูกต้อง");
        }
        attendee[field] = value?.trim() || null;
        if (ticketType.requiredFields.includes(field) && !attendee[field]) invalidOrder("กรุณากรอกข้อมูลผู้เข้าร่วมให้ครบ");
    }
    if (attendee.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendee.email)) invalidOrder("รูปแบบอีเมลไม่ถูกต้อง");
    if (attendee.phone && !/^[0-9]{9,10}$/.test(attendee.phone)) invalidOrder("กรุณากรอกเบอร์โทรผู้เข้าร่วมเป็นตัวเลข 9 หรือ 10 หลัก");
    return {
        ...attendee,
        souvenirItems: validateTicketSouvenirs(input.souvenirs, ticketType, eventSouvenirs),
    };
}

function validateTicketSouvenirs(
    input: TicketAttendeeInput["souvenirs"],
    ticketType: EventTicket,
    eventSouvenirs: EventSouvenirItem[],
): TicketSouvenir[] {
    const includedSouvenirs = eventSouvenirs.filter((souvenir) => ticketCanReceiveSouvenir(souvenir, ticketType.id));
    const selectedSouvenirs = input === undefined ? [] : input;
    if (!Array.isArray(selectedSouvenirs) || selectedSouvenirs.length > includedSouvenirs.length) {
        invalidOrder("รายการของที่ระลึกไม่ตรงกับสิทธิ์ของบัตร");
    }

    const selectedIds = new Set<string>();
    const souvenirItems: TicketSouvenir[] = [];
    for (const selection of selectedSouvenirs) {
        const souvenir = includedSouvenirs.find((item) => item.id === selection?.souvenirId);
        if (!souvenir || selectedIds.has(souvenir.id)) invalidOrder("รายการของที่ระลึกไม่ตรงกับสิทธิ์ของบัตร");

        const size = selection.size ?? null;
        if (!isValidSize(souvenir, size)) invalidOrder(`กรุณาเลือกขนาดของ ${souvenir.name} ที่เปิดให้เลือก`);

        selectedIds.add(souvenir.id);
        souvenirItems.push({ souvenirId: souvenir.id, name: souvenir.name, size });
    }

    const missingRequiredSouvenir = includedSouvenirs.some((souvenir) => !souvenir.allowDecline && !selectedIds.has(souvenir.id));
    if (missingRequiredSouvenir) {
        invalidOrder("กรุณาเลือกของที่ระลึกที่รวมมากับบัตรให้ครบ");
    }
    return souvenirItems;
}

function isValidSize(souvenir: EventSouvenirItem, size: string | null) {
    if (souvenir.sizes.length === 0) return size === null;
    return typeof size === "string" && souvenir.sizes.includes(size);
}

export function validateShipping(shipping: OrderShippingInput | null | undefined): OrderShippingInput {
    if (!shipping || typeof shipping !== "object") invalidOrder("กรุณากรอกที่อยู่จัดส่งให้ครบ");
    const fields = ["recipientName", "recipientPhone", "addressLine", "subDistrict", "district", "province", "postalCode"] as const;
    for (const field of fields) {
        if (typeof shipping[field] !== "string" || !shipping[field].trim() || shipping[field].trim().length > 100) invalidOrder("กรุณาตรวจสอบที่อยู่จัดส่ง");
    }
    if (!/^[0-9]{5}$/.test(shipping.postalCode.trim()) || !/^[0-9+() -]{8,20}$/.test(shipping.recipientPhone.trim())) invalidOrder("เบอร์โทรหรือรหัสไปรษณีย์ไม่ถูกต้อง");
    if (shipping.note != null && typeof shipping.note !== "string") invalidOrder("หมายเหตุจัดส่งต้องเป็นข้อความ");
    return {
        recipientName: shipping.recipientName.trim(),
        recipientPhone: shipping.recipientPhone.trim(),
        addressLine: shipping.addressLine.trim(),
        subDistrict: shipping.subDistrict.trim(),
        district: shipping.district.trim(),
        province: shipping.province.trim(),
        postalCode: shipping.postalCode.trim(),
        note: shipping.note?.trim() || null,
    };
}

export function priceSouvenirs(
    input: OrderSouvenirInput[] | undefined,
    souvenirs: EventSouvenirItem[],
    ticketTypeIds: readonly string[],
): OrderSouvenirItem[] {
    if (input === undefined) return [];
    if (!Array.isArray(input) || input.length > 10) invalidOrder("รายการของที่ระลึกไม่ถูกต้อง");
    const orderedVariants = new Set<string>();
    const souvenirItems: OrderSouvenirItem[] = [];
    let totalQuantity = 0;
    for (const item of input) {
        const souvenir = item && souvenirs.find((entry) => entry.id === item.souvenirId);
        if (!souvenir || !canBuySouvenirExtra(souvenir, ticketTypeIds)) {
            invalidOrder("รายการนี้ไม่เปิดให้สั่งเพิ่มสำหรับบัตรที่เลือก");
        }
        const size = item.size ?? null;
        const variant = souvenirVariantKey(souvenir.id, size);
        const validQuantity = Number.isSafeInteger(item.quantity) && item.quantity >= 1;
        if (!isValidSize(souvenir, size) || orderedVariants.has(variant) || !validQuantity) {
            invalidOrder("รายการสั่งของที่ระลึกเพิ่มไม่ถูกต้อง");
        }
        totalQuantity += item.quantity;
        if (totalQuantity > 10) invalidOrder("สั่งของที่ระลึกเพิ่มรวมได้ไม่เกิน 10 ชิ้น");

        orderedVariants.add(variant);
        souvenirItems.push({ souvenirId: souvenir.id, name: souvenir.name, size, quantity: item.quantity, unitPrice: souvenir.extraPrice });
    }
    return souvenirItems;
}
