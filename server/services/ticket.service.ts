import "server-only";
import { getDatabase } from "@/server/database/database.souce";
import { EventTicket } from "@/server/database/entities";
import { EventTicketInput, EventTicketItem } from "@/lib/api-types";
import { ApiError } from "@/server/http/errors";

export async function getEventTickets(eventId: string): Promise<EventTicketItem[]> {
    const db = await getDatabase();
    const list = await db.getRepository(EventTicket).find({
        where: { eventId },
        order: { sortOrder: "ASC", createdAt: "ASC" },
    });
    return list.map(toEventTicketItem);
}

export async function createEventTicket(eventId: string, input: EventTicketInput): Promise<EventTicketItem> {
    if (!input.name?.trim()) throw new ApiError("VALIDATION_ERROR", "กรุณาระบุชื่อบัตร", 422);
    const db = await getDatabase();
    const repo = db.getRepository(EventTicket);
    const entity = repo.create({
        eventId,
        name: input.name.trim(),
        description: input.description ?? null,
        price: Number(input.price || 0).toFixed(2),
        quota: input.quota,
        minTicketQTY: input.minTicketQTY ?? 1,
        maxTicketQTY: input.maxTicketQTY ?? 1,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true,
        includesSouvenir: input.includesSouvenir ?? true,
        requiredFields: input.requiredFields ?? [],
    });
    return toEventTicketItem(await repo.save(entity));
}

export async function updateEventTicket(eventId: string, ticketId: string, input: Partial<EventTicketInput>): Promise<EventTicketItem> {
    const db = await getDatabase();
    const repo = db.getRepository(EventTicket);
    const ticket = await repo.findOneBy({ id: ticketId, eventId });
    if (!ticket) throw new ApiError("TICKET_NOT_FOUND", "ไม่พบประเภทบัตรที่ต้องการแก้ไข", 404);
    if (input.name !== undefined) ticket.name = input.name.trim();
    if (input.description !== undefined) ticket.description = input.description;
    if (input.price !== undefined) ticket.price = Number(input.price).toFixed(2);
    if (input.quota !== undefined) ticket.quota = input.quota;
    if (input.minTicketQTY !== undefined) ticket.minTicketQTY = input.minTicketQTY;
    if (input.maxTicketQTY !== undefined) ticket.maxTicketQTY = input.maxTicketQTY;
    if (input.sortOrder !== undefined) ticket.sortOrder = input.sortOrder;
    if (input.isActive !== undefined) ticket.isActive = input.isActive;
    if (input.includesSouvenir !== undefined) ticket.includesSouvenir = input.includesSouvenir;
    if (input.requiredFields !== undefined) ticket.requiredFields = input.requiredFields;
    return toEventTicketItem(await repo.save(ticket));
}

export async function deleteEventTicket(eventId: string, ticketId: string): Promise<{ id: string }> {
    const db = await getDatabase();
    const repo = db.getRepository(EventTicket);
    const ticket = await repo.findOneBy({ id: ticketId, eventId });
    if (!ticket) throw new ApiError("TICKET_NOT_FOUND", "ไม่พบประเภทบัตร", 404);
    if (ticket.sold > 0) throw new ApiError("TICKET_HAS_SOLD", "ไม่สามารถลบบัตรที่มีการซื้อไปแล้วได้", 400);
    await repo.remove(ticket);
    return { id: ticketId };
}

function toEventTicketItem(t: EventTicket): EventTicketItem {
    return {
        id: t.id,
        eventId: t.eventId,
        name: t.name,
        description: t.description,
        price: t.price,
        quota: t.quota,
        sold: t.sold,
        minTicketQTY: t.minTicketQTY,
        maxTicketQTY: t.maxTicketQTY,
        sortOrder: t.sortOrder,
        isActive: t.isActive,
        includesSouvenir: t.includesSouvenir,
        requiredFields: t.requiredFields,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
    };
}