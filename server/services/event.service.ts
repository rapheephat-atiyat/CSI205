import "server-only";
import type { EventDetail, EventInput, EventSessionInput, EventSouvenirItem, EventSummary } from "@/lib/api-types";
import { getDatabase } from "@/server/database/database.souce";
import { Events, EventSession, Order, Store, User } from "@/server/database/entities";
import { ApiError } from "@/server/http/errors";
import { hasPermission } from "@/server/auth/permission";
import { PERMISSIONS } from "@/lib/permissions";
import { In, type EntityManager } from "typeorm";
import { getEventSouvenirs } from "./event-souvenirs";
import { readMoney } from "./money";
import { toEventTicketItem } from "./ticket.service";

const eventNotFound = () => new ApiError("EVENT_NOT_FOUND", "ไม่พบงานที่ต้องการ", 404);

export async function getEvents(): Promise<EventSummary[]> {
    const db = await getDatabase();
    const events = await db.getRepository(Events).find({
        select: { id: true, slug: true, title: true, subTitle: true, thumbnail: true, venue: true, tags: true, buyAt: true, buyEndAt: true },
        order: { createdAt: "ASC", buyAt: "ASC" },
    });
    return events.map(toEventSummary);
}

export async function getEventBySlug(slug: string): Promise<EventDetail> {
    const db = await getDatabase();
    return findEventDetail(db.manager, { slug });
}

export async function listManageableEvents(user: User): Promise<EventSummary[]> {
    if (hasPermission(user, PERMISSIONS.EVENT_UPDATE)) return getEvents();

    const eventIds: string[] = [];
    for (const role of user.userRoles) {
        const canEditEvent = role.permissions.some((grant) => grant.permission === PERMISSIONS.EVENT_UPDATE);
        if (role.eventId && !role.storeId && canEditEvent) eventIds.push(role.eventId);
    }

    if (eventIds.length === 0) return [];
    const db = await getDatabase();
    const events = await db.getRepository(Events).find({ where: { id: In(eventIds) }, order: { buyAt: "ASC" } });
    return events.map(toEventSummary);
}

export async function getEventById(id: string): Promise<EventDetail> {
    const db = await getDatabase();
    return findEventDetail(db.manager, { id });
}

async function findEventDetail(manager: EntityManager, where: { id: string } | { slug: string }): Promise<EventDetail> {
    const event = await manager.findOne(Events, {
        where,
        relations: { sessions: true, stores: true, tickets: true },
    });
    if (!event) throw eventNotFound();

    const souvenirs = await getEventSouvenirs(manager, event.id);
    return toEventDetail(event, souvenirs);
}

export async function createEvent(input: EventInput): Promise<EventDetail> {
    checkEventRules(input);
    const eventFields = readEventFields(input);
    if (!eventFields.slug || !eventFields.title) {
        throw new ApiError("VALIDATION_ERROR", "กรุณาระบุชื่อและ slug ของงาน", 422);
    }
    const db = await getDatabase();
    const eventRepo = db.getRepository(Events);
    const existingEvent = await eventRepo.existsBy({ slug: eventFields.slug });
    if (existingEvent) {
        throw new ApiError("EVENT_SLUG_ALREADY_EXISTS", "Slug นี้ถูกใช้งานแล้ว", 409);
    }

    return db.transaction(async (manager) => {
        const event = manager.create(Events, {
            ...eventFields,
            buyAt: new Date(input.buyAt),
            buyEndAt: new Date(input.buyEndAt),
        });
        const savedEvent = await manager.save(event);
        await saveEventSchedule(manager, savedEvent.id, input.sessions);
        return findEventDetail(manager, { id: savedEvent.id });
    });
}

export async function updateEvent(id: string, input: Partial<EventInput>): Promise<EventDetail> {
    if (Object.keys(input).length === 0) {
        throw new ApiError("VALIDATION_ERROR", "ไม่มีข้อมูลที่ต้องแก้ไข", 422);
    }
    const db = await getDatabase();
    return db.transaction(async (manager) => {
        const eventRepo = manager.getRepository(Events);
        const event = await eventRepo.findOne({ where: { id }, lock: { mode: "pessimistic_write" } });
        if (!event) throw eventNotFound();

        const buyAt = input.buyAt ?? event.buyAt.toISOString();
        const buyEndAt = input.buyEndAt ?? event.buyEndAt.toISOString();
        checkEventRules({
            buyAt,
            buyEndAt,
            minTicketQTY: input.minTicketQTY ?? event.minTicketQTY,
            maxTicketQTY: input.maxTicketQTY ?? event.maxTicketQTY,
        });

        eventRepo.merge(event, {
            ...readEventFields(input),
            buyAt: new Date(buyAt),
            buyEndAt: new Date(buyEndAt),
        });

        const savedEvent = await eventRepo.save(event);
        await saveEventSchedule(manager, savedEvent.id, input.sessions);
        return findEventDetail(manager, { id: savedEvent.id });
    });
}

function readEventFields(input: Partial<EventInput>) {
    return {
        slug: input.slug,
        title: input.title,
        subTitle: input.subTitle,
        banner: input.banner,
        thumbnail: input.thumbnail,
        venue: input.venue,
        description: input.description,
        tags: input.tags,
        minTicketQTY: input.minTicketQTY,
        maxTicketQTY: input.maxTicketQTY,
        allowShipping: input.allowShipping,
        shippingFee: input.shippingFee === undefined ? undefined : readMoney(input.shippingFee, true).toFixed(2),
    };
}

async function saveEventSchedule(manager: EntityManager, eventId: string, input?: EventSessionInput[]) {
    if (input === undefined) return;
    if (!Array.isArray(input)) throw new ApiError("VALIDATION_ERROR", "กำหนดการต้องเป็นรายการกิจกรรม", 422);

    // ถ้าส่งกำหนดการมา ให้เก็บรอบที่ส่งมาพร้อม ID เดิม และลบรอบที่เอาออกจากรายการ
    const previousSessions = await manager.findBy(EventSession, { eventId });
    const remainingIds = new Set(previousSessions.map((session) => session.id));
    const sessions = [];
    for (const item of input) {
        const title = typeof item?.title === "string" ? item.title.trim() : "";
        if (!title || title.length > 255) throw new ApiError("VALIDATION_ERROR", "กรุณาใส่ชื่อรอบกิจกรรมไม่เกิน 255 ตัวอักษร", 422);
        if (item.id !== undefined && !remainingIds.delete(item.id)) {
            throw new ApiError("VALIDATION_ERROR", "รหัสรอบกิจกรรมซ้ำหรือไม่อยู่ในงานนี้", 422);
        }
        if (item.description != null && typeof item.description !== "string") {
            throw new ApiError("VALIDATION_ERROR", "รายละเอียดรอบกิจกรรมต้องเป็นข้อความ", 422);
        }
        const startsAt = typeof item.startsAt === "string" ? new Date(item.startsAt) : null;
        const endsAt = typeof item.endsAt === "string" ? new Date(item.endsAt) : null;
        const hasTime = item.startsAt != null || item.endsAt != null;
        if (hasTime && (!startsAt || !endsAt || !(startsAt < endsAt))) {
            throw new ApiError("VALIDATION_ERROR", "กรุณาระบุเวลาเริ่มและเวลาสิ้นสุดให้ถูกต้อง", 422);
        }
        sessions.push(manager.create(EventSession, {
            id: item.id,
            eventId,
            title,
            description: item.description?.trim() || null,
            startsAt,
            endsAt,
        }));
    }

    if (remainingIds.size > 0) await manager.delete(EventSession, { eventId, id: In([...remainingIds]) });
    if (sessions.length > 0) await manager.save(sessions);
}

export async function deleteEvent(id: string): Promise<{ id: string }> {
    const db = await getDatabase();
    if (await db.getRepository(Order).existsBy({ eventId: id })) {
        throw new ApiError("EVENT_HAS_ORDERS", "งานนี้มีออเดอร์แล้ว ลบไม่ได้", 409);
    }
    if (await db.getRepository(Store).existsBy({ eventId: id })) {
        throw new ApiError("EVENT_HAS_STORES", "งานนี้มีร้านค้าที่ผูกอยู่ ลบไม่ได้", 409);
    }
    const result = await db.getRepository(Events).delete({ id });
    if (!result.affected) throw eventNotFound();
    return { id };
}

export function isEventSelling(event: Pick<EventDetail, "buyAt" | "buyEndAt">) {
    const now = Date.now();
    return now >= Date.parse(event.buyAt) && now < Date.parse(event.buyEndAt);
}

function checkEventRules(input: Pick<EventInput, "buyAt" | "buyEndAt" | "minTicketQTY" | "maxTicketQTY">) {
    const start = Date.parse(input.buyAt);
    const end = Date.parse(input.buyEndAt);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
        throw new ApiError("VALIDATION_ERROR", "วันปิดขายต้องอยู่หลังวันเริ่มขาย", 422);
    }
    if (!Number.isInteger(input.minTicketQTY) || input.minTicketQTY < 1
        || !Number.isInteger(input.maxTicketQTY) || input.minTicketQTY > input.maxTicketQTY) {
        throw new ApiError("VALIDATION_ERROR", "จำนวนบัตรขั้นต่ำต้องไม่มากกว่าจำนวนสูงสุด", 422);
    }
}

function toEventSummary(event: Events): EventSummary {
    return {
        id: event.id,
        slug: event.slug,
        title: event.title,
        subTitle: event.subTitle,
        thumbnail: event.thumbnail,
        venue: event.venue,
        tags: event.tags,
        buyAt: event.buyAt.toISOString(),
        buyEndAt: event.buyEndAt.toISOString(),
    };
}

function toEventDetail(event: Events, souvenirs: EventSouvenirItem[]): EventDetail {
    const ticketTypes = (event.tickets ?? []).toSorted((first, second) =>
        first.sortOrder - second.sortOrder || first.id.localeCompare(second.id)
    );
    const sessions = (event.sessions ?? []).toSorted((first, second) => {
        const firstStart = first.startsAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const secondStart = second.startsAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return firstStart - secondStart || first.id.localeCompare(second.id);
    });
    return {
        ...toEventSummary(event),
        souvenirs,
        banner: event.banner,
        description: event.description,
        minTicketQTY: event.minTicketQTY,
        maxTicketQTY: event.maxTicketQTY,
        allowShipping: event.allowShipping,
        shippingFee: event.shippingFee,
        sessions: sessions.map((session) => ({
            id: session.id,
            title: session.title,
            description: session.description,
            startsAt: session.startsAt?.toISOString() ?? null,
            endsAt: session.endsAt?.toISOString() ?? null,
        })),
        stores: (event.stores ?? []).map((store) => ({
            id: store.id,
            name: store.name,
            description: store.description,
            thumbnail: store.thumbnail,
        })),
        tickets: ticketTypes.map(toEventTicketItem),
    };
}
