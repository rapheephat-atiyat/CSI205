import "server-only";
import type { EventDetail, EventInput, EventSummary } from "@/lib/api-types";
import { getDatabase } from "@/server/database/database.souce";
import { Events, User } from "@/server/database/entities";
import { ApiError } from "@/server/http/errors";
import { hasPermission } from "@/server/auth/permission";
import { PERMISSIONS } from "@/lib/permissions";
import { In } from "typeorm";

const notFound = () => new ApiError("EVENT_NOT_FOUND", "ไม่พบงานที่ต้องการ", 404);

export async function getEvents(): Promise<EventSummary[]> {
    const db = await getDatabase();
    const events = await db.getRepository(Events).find({ order: { createdAt: "ASC", buyAt: "ASC" } });
    return events.map(toEventSummary);
}

export async function getEventBySlug(slug: string): Promise<EventDetail> {
    const db = await getDatabase();
    const event = await db.getRepository(Events).findOne({
        where: {
            slug,
        },
        relations: { sessions: true, stores: true, tickets: true },
    });
    if (!event) throw new ApiError("EVENT_NOT_FOUND", "ไม่พบงานที่ต้องการ", 404);
    return toEventDetail(event);
}

export async function listManagableEvents(user: User): Promise<EventSummary[]> {
    if (hasPermission(user, PERMISSIONS.EVENT_UPDATE)) {
        const events = await (await getDatabase()).getRepository(Events).find({ order: { createdAt: "ASC", buyAt: "ASC" } });
        return events.map(toEventSummary);
    }

    const eventIds = user.userRoles.flatMap((r) =>
        r.eventId !== null && r.permissions.some((p) => p.permission === PERMISSIONS.EVENT_UPDATE) ? [r.eventId] : []
    );

    if (eventIds.length === 0) return [];
    const events = await (await getDatabase()).getRepository(Events).find({ where: { id: In(eventIds) }, order: { buyAt: "ASC" } });
    return events.map(toEventSummary);
}

export async function getEventById(id: string): Promise<EventDetail> {
    const repo = (await getDatabase()).getRepository(Events);
    const event = await repo.findOne({ where: { id }, relations: { sessions: true, stores: true, tickets: true } });
    if (!event) throw notFound();
    return toEventDetail(event);
}

export async function createEvent(input: EventInput): Promise<EventDetail> {
    CheckEventRules(input);
    const repo = (await getDatabase()).getRepository(Events);
    const existingEvent = await repo.findOne({
        where: {
            slug: input.slug,
        },
    });
    if (existingEvent) {
        throw new ApiError("EVENT_SLUG_ALREADY_EXISTS", "Slug นี้ถูกใช้งานแล้ว", 409);
    }

    const raw = repo.create({
        ...input,
        buyAt: new Date(input.buyAt),
        buyEndAt: new Date(input.buyEndAt),
    });

    const event = await repo.save(raw);
    return toEventDetail(event);
}

export async function updateEvent(id: string, input: Partial<EventInput>): Promise<EventDetail> {
    if (Object.keys(input).length === 0) {
        throw new ApiError("VALIDATION_ERROR", "ไม่มีข้อมูลที่ต้องแก้ไข", 422);
    }
    const repo = (await getDatabase()).getRepository(Events);
    const event = await repo.findOne({ where: { id }, relations: { sessions: true, stores: true, tickets: true } });
    if (!event) throw notFound();

    CheckEventRules({
        buyAt: input.buyAt ?? event.buyAt.toISOString(),
        buyEndAt: input.buyEndAt ?? event.buyEndAt.toISOString(),
        minTicketQTY: input.minTicketQTY ?? event.minTicketQTY,
        maxTicketQTY: input.maxTicketQTY ?? event.maxTicketQTY,
    });

    repo.merge(event, {
        ...input,
        buyAt: input.buyAt ? new Date(input.buyAt) : event.buyAt,
        buyEndAt: input.buyEndAt ? new Date(input.buyEndAt) : event.buyEndAt,
    });

    const newEvent = await repo.save(event);
    return toEventDetail(newEvent);
}

export async function dropEvnet(id: string): Promise<void> {
    const repo = (await getDatabase()).getRepository(Events);
    const res = await repo.delete({ id });
    if (!res.affected) throw notFound();
}

export function isEventSelling(event: Pick<EventDetail, "buyAt" | "buyEndAt">) {
    const now = Date.now();
    return now >= Date.parse(event.buyAt) && now < Date.parse(event.buyEndAt);
}

function CheckEventRules(values: Pick<EventInput, "buyAt" | "buyEndAt" | "minTicketQTY" | "maxTicketQTY">) {
    if (Date.parse(values.buyAt) >= Date.parse(values.buyEndAt)) {
        throw new ApiError("VALIDATION_ERROR", "วันปิดขายต้องอยู่หลังวันเริ่มขาย", 422);
    }
    if (values.minTicketQTY > values.maxTicketQTY) {
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

function toEventDetail(event: Events): EventDetail {
    return {
        ...toEventSummary(event),
        banner: event.banner,
        description: event.description,
        minTicketQTY: event.minTicketQTY,
        maxTicketQTY: event.maxTicketQTY,
        hasSouvenir: event.hasSouvenir,
        souvenirName: event.souvenirName,
        souvenirImage: event.souvenirImage,
        souvenirSizes: event.souvenirSizes,
        souvenirPrice: event.souvenirPrice,
        souvenirAllowDecline: event.souvenirAllowDecline,
        allowShipping: event.allowShipping,
        shippingFee: event.shippingFee,
        sessions: (event.sessions ?? []).map((session) => ({ id: session.id })),
        stores: (event.stores ?? []).map((store) => ({
            id: store.id,
            name: store.name,
            description: store.description,
            thumbnail: store.thumbnail,
        })),
        tickets: (event.tickets ?? []).toSorted((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)).map((t) => ({
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
        })),
    };
}
