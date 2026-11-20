import "server-only";
import type { EventSouvenirInput, EventSouvenirItem } from "@/lib/api-types";
import { isSouvenirImageUrl } from "@/lib/souvenirs";
import { getDatabase } from "@/server/database/database.souce";
import { Events, EventSouvenir, EventTicket, SouvenirTicketType } from "@/server/database/entities";
import { ApiError } from "@/server/http/errors";
import type { EntityManager } from "typeorm";
import { readMoney } from "./money";
import { readUuid } from "@/server/http/validation";
import { recordAdminActivity } from "./admin-activity";

export async function getEventSouvenirs(manager: EntityManager, eventId: string): Promise<EventSouvenirItem[]> {
    const souvenirs = await manager.find(EventSouvenir, {
        where: { eventId },
        relations: { ticketTypeLinks: true },
        order: { name: "ASC", id: "ASC" },
    });

    return souvenirs.map(toSouvenirItem);
}

export async function getSouvenir(eventId: string, souvenirId: string): Promise<EventSouvenirItem> {
    readUuid(eventId, "รหัสงาน"); readUuid(souvenirId, "รหัสของที่ระลึก");
    const db = await getDatabase();
    const souvenir = await db.manager.findOne(EventSouvenir, {
        where: { id: souvenirId, eventId },
        relations: { ticketTypeLinks: true },
    });
    if (!souvenir) throw new ApiError("SOUVENIR_NOT_FOUND", "ไม่พบของที่ระลึกในงานนี้", 404);
    return toSouvenirItem(souvenir);
}

export async function createSouvenir(eventId: string, input: EventSouvenirInput, actorId?: string): Promise<EventSouvenirItem> {
    readUuid(eventId, "รหัสงาน");
    const db = await getDatabase();
    if (!await db.manager.existsBy(Events, { id: eventId })) {
        throw new ApiError("EVENT_NOT_FOUND", "ไม่พบงานที่ต้องการ", 404);
    }
    return saveSouvenir(eventId, input, undefined, actorId);
}

export async function updateSouvenir(eventId: string, souvenirId: string, input: Partial<EventSouvenirInput>, actorId?: string): Promise<EventSouvenirItem> {
    readUuid(eventId, "รหัสงาน"); readUuid(souvenirId, "รหัสของที่ระลึก");
    return saveSouvenir(eventId, input, souvenirId, actorId);
}

async function saveSouvenir(eventId: string, input: Partial<EventSouvenirInput>, souvenirId?: string, actorId?: string): Promise<EventSouvenirItem> {
    if ((input.allowDecline !== undefined && typeof input.allowDecline !== "boolean") || (input.allTicketTypes !== undefined && typeof input.allTicketTypes !== "boolean") || (input.image != null && typeof input.image !== "string")) throw new ApiError("VALIDATION_ERROR", "การตั้งค่าของที่ระลึกไม่ถูกต้อง", 422);
    const image = input.image?.trim() || null;
    if (image && !isSouvenirImageUrl(image)) {
        throw new ApiError("VALIDATION_ERROR", "กรุณาใส่ลิงก์รูป HTTPS หรือพาธในเว็บไซต์", 422);
    }
    const db = await getDatabase();
    return db.transaction(async (manager) => {
        const souvenir = souvenirId
            ? await manager.findOne(EventSouvenir, {
                where: { id: souvenirId, eventId },
                lock: { mode: "pessimistic_write" },
            })
            : manager.create(EventSouvenir, { eventId, name: "", sizes: [], image: null, extraPrice: null, allowDecline: true, allTicketTypes: false });
        if (!souvenir) throw new ApiError("SOUVENIR_NOT_FOUND", "ไม่พบของที่ระลึกในงานนี้", 404);

        if (input.name !== undefined) souvenir.name = typeof input.name === "string" ? input.name.trim() : "";
        if (!souvenir.name || souvenir.name.length > 255) {
            throw new ApiError("VALIDATION_ERROR", "กรุณาระบุชื่อของที่ระลึกไม่เกิน 255 ตัวอักษร", 422);
        }
        if (input.image !== undefined) souvenir.image = image;
        if (input.sizes !== undefined) {
            if (!Array.isArray(input.sizes) || input.sizes.some((size) => typeof size !== "string" || !size.trim())) {
                throw new ApiError("VALIDATION_ERROR", "ไซซ์ต้องเป็นรายการข้อความ เช่น S, M, L", 422);
            }
            souvenir.sizes = [...new Set(input.sizes.map((size) => size.trim()))];
        }
        if (input.extraPrice !== undefined) {
            souvenir.extraPrice = input.extraPrice === null ? null : readMoney(input.extraPrice, true).toFixed(2);
        }
        if (input.allowDecline !== undefined) souvenir.allowDecline = input.allowDecline;
        if (input.allTicketTypes !== undefined) souvenir.allTicketTypes = input.allTicketTypes;

        const savedSouvenir = await manager.save(souvenir);
        if (savedSouvenir.allTicketTypes || input.eligibleTicketTypeIds !== undefined) {
            // ถ้าทุกบัตรรับได้ ก็ไม่ต้องมีรายการสิทธิ์แยกทีละประเภท
            const ticketTypeIds = savedSouvenir.allTicketTypes ? [] : input.eligibleTicketTypeIds;
            if (!Array.isArray(ticketTypeIds)) {
                throw new ApiError("VALIDATION_ERROR", "กรุณาส่งรายการ ID ประเภทบัตร", 422);
            }
            const ticketTypes = ticketTypeIds.length > 0 ? await manager.findBy(EventTicket, { eventId }) : [];
            const allowedIds = new Set(ticketTypes.map((ticketType) => ticketType.id));
            if (ticketTypeIds.some((id) => !allowedIds.has(id))) {
                throw new ApiError("VALIDATION_ERROR", "ประเภทบัตรต้องอยู่ในงานเดียวกับของที่ระลึก", 422);
            }

            await manager.delete(SouvenirTicketType, { souvenirId: savedSouvenir.id });
            if (ticketTypeIds.length > 0) {
                await manager.insert(SouvenirTicketType, [...new Set(ticketTypeIds)].map((ticketTypeId) => ({
                    souvenirId: savedSouvenir.id, ticketTypeId, eventId,
                })));
            }
        }
        savedSouvenir.ticketTypeLinks = await manager.findBy(SouvenirTicketType, { souvenirId: savedSouvenir.id });
        await recordAdminActivity(manager, actorId, eventId, souvenirId ? "souvenir.update" : "souvenir.create", savedSouvenir.id);
        return toSouvenirItem(savedSouvenir);
    });
}

export async function deleteSouvenir(eventId: string, souvenirId: string, actorId?: string): Promise<{ id: string }> {
    readUuid(eventId, "รหัสงาน"); readUuid(souvenirId, "รหัสของที่ระลึก");
    const db = await getDatabase();
    await db.transaction(async (manager) => {
        const result = await manager.delete(EventSouvenir, { id: souvenirId, eventId });
        if (!result.affected) throw new ApiError("SOUVENIR_NOT_FOUND", "ไม่พบของที่ระลึกในงานนี้", 404);
        await recordAdminActivity(manager, actorId, eventId, "souvenir.delete", souvenirId);
    });
    return { id: souvenirId };
}

function toSouvenirItem(souvenir: EventSouvenir): EventSouvenirItem {
    return {
        id: souvenir.id,
        name: souvenir.name,
        image: souvenir.image,
        sizes: souvenir.sizes,
        extraPrice: souvenir.extraPrice,
        allowDecline: souvenir.allowDecline,
        allTicketTypes: souvenir.allTicketTypes,
        eligibleTicketTypeIds: souvenir.ticketTypeLinks.map((link) => link.ticketTypeId),
    };
}

