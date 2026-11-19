import "server-only";
import { getDatabase } from "@/server/database/database.souce";
import { Events, EventTicket, Ticket, type User } from "@/server/database/entities";
import type { EventTicketInput, EventTicketItem, TicketItem } from "@/lib/api-types";
import { PERMISSIONS } from "@/lib/permissions";
import { hasPermission } from "@/server/auth/permission";
import { ATTENDEE_FIELDS, TICKET_STATUSES } from "@/server/database/enums/domain.enum";
import { ApiError } from "@/server/http/errors";
import { readMoney } from "./money";
import { readUuid } from "@/server/http/validation";
import { recordAdminActivity } from "./admin-activity";

export async function getEventTickets(eventId: string): Promise<EventTicketItem[]> {
    readUuid(eventId, "รหัสงาน");
    const db = await getDatabase();
    const ticketTypes = await db.getRepository(EventTicket).find({
        where: { eventId },
        order: { sortOrder: "ASC", createdAt: "ASC" },
    });
    return ticketTypes.map(toEventTicketItem);
}

export async function getEventTicket(eventId: string, ticketId: string): Promise<EventTicketItem> {
    readUuid(eventId, "รหัสงาน"); readUuid(ticketId, "รหัสประเภทบัตร");
    const db = await getDatabase();
    const ticketType = await db.getRepository(EventTicket).findOneBy({ id: ticketId, eventId });
    if (!ticketType) throw new ApiError("TICKET_NOT_FOUND", "ไม่พบประเภทบัตรในงานนี้", 404);
    return toEventTicketItem(ticketType);
}

export async function createEventTicket(eventId: string, input: EventTicketInput, actorId?: string): Promise<EventTicketItem> {
    readUuid(eventId, "รหัสงาน");
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (!name) throw new ApiError("VALIDATION_ERROR", "กรุณาระบุชื่อบัตร", 422);

    const db = await getDatabase();
    const eventExists = await db.getRepository(Events).existsBy({ id: eventId });
    if (!eventExists) throw new ApiError("EVENT_NOT_FOUND", "ไม่พบงานที่ต้องการ", 404);

    const ticketRepo = db.getRepository(EventTicket);
    const ticketType = ticketRepo.create({
        eventId,
        name,
        description: input.description ?? null,
        price: input.price,
        quota: input.quota,
        sold: 0,
        minTicketQTY: input.minTicketQTY ?? 1,
        maxTicketQTY: input.maxTicketQTY ?? 1,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true,
        requiredFields: input.requiredFields ?? [],
    });
    validateTicketType(ticketType);
    return db.transaction(async (manager) => {
        const savedTicketType = await manager.save(ticketType);
        await recordAdminActivity(manager, actorId, eventId, "ticket.create", savedTicketType.id);
        return toEventTicketItem(savedTicketType);
    });
}

export async function updateEventTicket(eventId: string, ticketId: string, input: Partial<EventTicketInput>, actorId?: string): Promise<EventTicketItem> {
    readUuid(eventId, "รหัสงาน"); readUuid(ticketId, "รหัสประเภทบัตร");
    const db = await getDatabase();
    return db.transaction(async (manager) => {
        const ticketRepo = manager.getRepository(EventTicket);
        const ticketType = await ticketRepo.findOne({
            where: { id: ticketId, eventId },
            lock: { mode: "pessimistic_write" },
        });
        if (!ticketType) throw new ApiError("TICKET_NOT_FOUND", "ไม่พบประเภทบัตรที่ต้องการแก้ไข", 404);

        // merge ใช้เฉพาะช่องที่ส่งมา ค่าเดิมของช่องอื่นจะยังอยู่
        ticketRepo.merge(ticketType, {
            name: typeof input.name === "string" ? input.name.trim() : input.name,
            description: input.description,
            price: input.price,
            quota: input.quota,
            minTicketQTY: input.minTicketQTY,
            maxTicketQTY: input.maxTicketQTY,
            sortOrder: input.sortOrder,
            isActive: input.isActive,
            requiredFields: input.requiredFields,
        });
        validateTicketType(ticketType);
        const savedTicketType = await ticketRepo.save(ticketType);
        await recordAdminActivity(manager, actorId, eventId, "ticket.update", ticketId);
        return toEventTicketItem(savedTicketType);
    });
}

export async function deleteEventTicket(eventId: string, ticketId: string, actorId?: string): Promise<{ id: string }> {
    readUuid(eventId, "รหัสงาน"); readUuid(ticketId, "รหัสประเภทบัตร");
    const db = await getDatabase();
    return db.transaction(async (manager) => {
        const ticketType = await manager.findOne(EventTicket, {
            where: { id: ticketId, eventId },
            lock: { mode: "pessimistic_write" },
        });
        if (!ticketType) throw new ApiError("TICKET_NOT_FOUND", "ไม่พบประเภทบัตร", 404);
        if (ticketType.sold > 0 || await manager.existsBy(Ticket, { eventTicketId: ticketId })) {
            throw new ApiError("TICKET_HAS_SOLD", "บัตรประเภทนี้มีประวัติการจองแล้ว ให้ปิดขายแทน", 409);
        }
        await manager.delete(EventTicket, { id: ticketId, eventId });
        await recordAdminActivity(manager, actorId, eventId, "ticket.delete", ticketId);
        return { id: ticketId };
    });
}

function validateTicketType(ticketType: EventTicket) {
    if (typeof ticketType.isActive !== "boolean" || !Number.isSafeInteger(ticketType.sortOrder) || ticketType.sortOrder < 0 || (ticketType.description !== null && (typeof ticketType.description !== "string" || ticketType.description.length > 5000))) throw new ApiError("VALIDATION_ERROR", "การตั้งค่าประเภทบัตรไม่ถูกต้อง", 422);
    if (typeof ticketType.name !== "string" || !ticketType.name || ticketType.name.length > 255) {
        throw new ApiError("VALIDATION_ERROR", "กรุณาระบุชื่อบัตรไม่เกิน 255 ตัวอักษร", 422);
    }
    ticketType.price = readMoney(ticketType.price, true).toFixed(2);
    if (!Number.isInteger(ticketType.quota) || ticketType.quota < ticketType.sold) {
        throw new ApiError("VALIDATION_ERROR", "โควตาบัตรต้องไม่ต่ำกว่าจำนวนที่จองไปแล้ว", 422);
    }
    if (!Number.isInteger(ticketType.minTicketQTY) || !Number.isInteger(ticketType.maxTicketQTY)
        || ticketType.minTicketQTY < 1 || ticketType.minTicketQTY > ticketType.maxTicketQTY) {
        throw new ApiError("VALIDATION_ERROR", "ตรวจจำนวนบัตรขั้นต่ำและสูงสุดต่อคำสั่งซื้อ", 422);
    }
    if (!Array.isArray(ticketType.requiredFields) || ticketType.requiredFields.some((field) => !Object.values(ATTENDEE_FIELDS).includes(field))) {
        throw new ApiError("VALIDATION_ERROR", "ช่องข้อมูลผู้เข้าร่วมไม่ถูกต้อง", 422);
    }
}

export async function scanTicket(staff: User, qrToken: string, action: "in" | "out" = "in"): Promise<TicketItem> {
    if (typeof qrToken !== "string" || !qrToken.trim()) {
        throw new ApiError("VALIDATION_ERROR", "กรุณาระบุ QR หรือรหัสของบัตร", 422);
    }

    const tokenOrCode = qrToken.trim();
    const db = await getDatabase();
    return db.transaction(async (manager) => {
        const ticket = await manager.findOne(Ticket, {
            where: [{ qrToken: tokenOrCode }, { ticketCode: tokenOrCode }],
            relations: { eventTicket: true, user: true },
            lock: { mode: "pessimistic_write" },
        });
        if (!ticket) throw new ApiError("TICKET_NOT_FOUND", "ไม่พบบัตรในระบบ", 404);
        if (!hasPermission(staff, PERMISSIONS.TICKET_SCAN, { eventId: ticket.eventId })) {
            throw new ApiError("FORBIDDEN", "คุณไม่มีสิทธิ์สแกนบัตรในงานนี้", 403);
        }

        if (action === "in") {
            if (ticket.status === TICKET_STATUSES.USED) {
                throw new ApiError("TICKET_ALREADY_USED", "บัตรนี้ถูกสแกนเข้างานไปแล้ว", 409);
            }
            if (ticket.status !== TICKET_STATUSES.ACTIVE) {
                throw new ApiError("TICKET_NOT_ACTIVE", "บัตรยังไม่ได้ชำระเงินหรือถูกยกเลิก", 400);
            }

            ticket.status = TICKET_STATUSES.USED;
            ticket.checkedInAt = new Date();
            ticket.checkedInById = staff.id;
        } else {
            if (ticket.status !== TICKET_STATUSES.USED) {
                throw new ApiError("TICKET_NOT_CHECKED_IN", "บัตรนี้ยังไม่ได้เช็กอินเข้างาน", 400);
            }
            ticket.status = TICKET_STATUSES.ACTIVE;
        }

        return toTicketItem(await manager.save(ticket));
    });
}

export function toEventTicketItem(ticketType: EventTicket): EventTicketItem {
    return {
        id: ticketType.id,
        eventId: ticketType.eventId,
        name: ticketType.name,
        description: ticketType.description,
        price: ticketType.price,
        quota: ticketType.quota,
        sold: ticketType.sold,
        minTicketQTY: ticketType.minTicketQTY,
        maxTicketQTY: ticketType.maxTicketQTY,
        sortOrder: ticketType.sortOrder,
        isActive: ticketType.isActive,
        requiredFields: ticketType.requiredFields,
        createdAt: ticketType.createdAt.toISOString(),
        updatedAt: ticketType.updatedAt.toISOString(),
    };
}

export function toTicketItem(ticket: Ticket): TicketItem {
    const canShowQr = ticket.status === TICKET_STATUSES.ACTIVE || ticket.status === TICKET_STATUSES.USED;
    return {
        id: ticket.id,
        orderId: ticket.orderId,
        eventId: ticket.eventId,
        eventTicketId: ticket.eventTicketId,
        ticketTypeName: ticket.eventTicket?.name,
        userId: ticket.userId,
        unitPrice: ticket.unitPrice,
        ticketCode: ticket.ticketCode,
        qrToken: canShowQr ? ticket.qrToken : "",
        status: ticket.status,
        firstName: ticket.firstName,
        lastName: ticket.lastName,
        phone: ticket.phone,
        email: ticket.email,
        graduationYear: ticket.graduationYear,
        checkedInAt: ticket.checkedInAt ? ticket.checkedInAt.toISOString() : null,
        checkedInById: ticket.checkedInById,
        souvenirItems: ticket.souvenirItems,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
    };
}
