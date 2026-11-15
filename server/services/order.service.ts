import "server-only";
import type { CreateOrderInput, OrderDetail, TicketItem } from "@/lib/api-types";
import { getDatabase } from "@/server/database/database.souce";
import { Events, EventTicket, Order, OrderShipping, Ticket, User } from "@/server/database/entities";
import { DELIVERY_METHODS, ORDER_STATUSES, TICKET_STATUSES } from "@/server/database/enums/domain.enum";
import { ApiError } from "@/server/http/errors";
import { In, IsNull, LessThanOrEqual, type EntityManager } from "typeorm";
import { invalidOrder, priceSouvenirs, validateAttendee, validatePaymentSlip, validateShipping } from "@/server/services/order-validation";
import { checkoutPaymentQr } from "@/server/services/checkout-payment";

const uuidPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const orderRelations = { shipping: true, tickets: { eventTicket: true } } as const;
const paymentHoldMs = 30 * 60 * 1000;

function toTicketItem(t: Ticket): TicketItem {
    return {
        id: t.id,
        orderId: t.orderId,
        eventId: t.eventId,
        eventTicketId: t.eventTicketId,
        ticketTypeName: t.eventTicket?.name,
        userId: t.userId,
        unitPrice: t.unitPrice,
        ticketCode: t.ticketCode,
        qrToken: t.status === TICKET_STATUSES.ACTIVE || t.status === TICKET_STATUSES.USED ? t.qrToken : "",
        status: t.status,
        firstName: t.firstName,
        lastName: t.lastName,
        phone: t.phone,
        email: t.email,
        graduationYear: t.graduationYear,
        checkedInAt: t.checkedInAt ? t.checkedInAt.toISOString() : null,
        checkedInById: t.checkedInById,
        receiveSouvenir: t.receiveSouvenir,
        souvenirSize: t.souvenirSize,
        souvenirClaimedAt: t.souvenirClaimedAt ? t.souvenirClaimedAt.toISOString() : null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
    };
}

function toOrderDetail(o: Order): OrderDetail {
    return {
        id: o.id,
        orderNo: o.orderNo,
        userId: o.userId,
        eventId: o.eventId,
        total: o.total,
        status: o.status,
        paymentSlip: o.paymentSlip?.startsWith("data:") ? null : o.paymentSlip,
        hasPaymentSlip: Boolean(o.paymentSlip),
        paymentDueAt: o.status === ORDER_STATUSES.PENDING && !o.paymentSlip
            ? new Date(o.createdAt.getTime() + paymentHoldMs).toISOString()
            : undefined,
        paidAt: o.paidAt ? o.paidAt.toISOString() : null,
        deliveryMethod: o.deliveryMethod,
        shippingFee: o.shippingFee,
        souvenirItems: o.souvenirItems ?? [],
        shipping: o.shipping
            ? {
                id: o.shipping.id,
                orderId: o.shipping.orderId,
                recipientName: o.shipping.recipientName,
                recipientPhone: o.shipping.recipientPhone,
                addressLine: o.shipping.addressLine,
                subDistrict: o.shipping.subDistrict,
                district: o.shipping.district,
                province: o.shipping.province,
                postalCode: o.shipping.postalCode,
                note: o.shipping.note,
                status: o.shipping.status,
                carrier: o.shipping.carrier,
                trackingNumber: o.shipping.trackingNumber,
                shippedAt: o.shipping.shippedAt ? o.shipping.shippedAt.toISOString() : null,
                createdAt: o.shipping.createdAt.toISOString(),
                updatedAt: o.shipping.updatedAt.toISOString(),
            }
            : null,
        tickets: (o.tickets ?? []).map(toTicketItem),
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
    };
}

export async function createOrder(userId: string, input: CreateOrderInput): Promise<OrderDetail> {
    if (!input || typeof input.eventId !== "string" || !uuidPattern.test(input.eventId)) invalidOrder("ข้อมูลงานไม่ถูกต้อง");
    if (!Object.values(DELIVERY_METHODS).includes(input.deliveryMethod)) invalidOrder("วิธีรับของที่ระลึกไม่ถูกต้อง");

    const requestId = "items" in input ? input.requestId : undefined;
    if ("items" in input && (typeof requestId !== "string" || !uuidPattern.test(requestId))) invalidOrder("รหัสคำสั่งซื้อไม่ถูกต้อง");
    const selections = "items" in input ? input.items : [{ ...input, attendees: input.attendees ?? [] }];
    if (!Array.isArray(selections) || selections.length === 0 || selections.length > 100) invalidOrder("กรุณาเลือกบัตร");
    for (const selection of selections) {
        if (!selection || typeof selection.eventTicketId !== "string" || !uuidPattern.test(selection.eventTicketId)
            || !Number.isSafeInteger(selection.quantity) || selection.quantity < 1
            || !Array.isArray(selection.attendees) || selection.attendees.length > selection.quantity
            || ("items" in input && selection.attendees.length !== selection.quantity)) {
            invalidOrder("จำนวนบัตรหรือข้อมูลผู้เข้าร่วมไม่ถูกต้อง");
        }
    }
    const typeIds = selections.map((selection) => selection.eventTicketId);
    if (new Set(typeIds).size !== typeIds.length) invalidOrder("พบประเภทบัตรซ้ำในคำสั่งซื้อ");
    const slip = input.paymentSlip == null ? null : validatePaymentSlip(input.paymentSlip);
    const db = await getDatabase();
    await releaseExpiredOrderHolds({ eventId: input.eventId });

    const order = await db.transaction(async (manager) => {
        if (requestId) {
            await manager.findOne(User, { where: { id: userId }, lock: { mode: "pessimistic_write" } });
            const existing = await manager.findOneBy(Order, { id: requestId, userId });
            if (existing) return existing;
        }

        const event = await manager.findOneBy(Events, { id: input.eventId });
        if (!event) throw new ApiError("EVENT_NOT_FOUND", "ไม่พบงานที่ต้องการ", 404);
        const now = Date.now();
        if (now < event.buyAt.getTime() || now >= event.buyEndAt.getTime()) {
            throw new ApiError("SALES_CLOSED", "ขณะนี้อยู่นอกช่วงจำหน่ายบัตร", 409);
        }
        const totalQuantity = selections.reduce((sum, item) => sum + item.quantity, 0);
        if (totalQuantity < event.minTicketQTY || totalQuantity > event.maxTicketQTY) {
            invalidOrder(`กรุณาเลือกบัตรระหว่าง ${event.minTicketQTY} ถึง ${event.maxTicketQTY} ใบ`);
        }

        const types = await manager.find(EventTicket, {
            where: { id: In(typeIds), eventId: event.id, isActive: true },
            order: { id: "ASC" },
            lock: { mode: "pessimistic_write" },
        });
        const byId = new Map(types.map((type) => [type.id, type]));
        const lines = selections.map((selection) => {
            const type = byId.get(selection.eventTicketId);
            if (!type) throw new ApiError("TICKET_NOT_FOUND", "ไม่พบประเภทบัตรที่เปิดจำหน่าย", 404);
            const { quantity } = selection;
            if (quantity < type.minTicketQTY || quantity > type.maxTicketQTY) {
                invalidOrder(`กรุณาเลือก ${type.name} ระหว่าง ${type.minTicketQTY} ถึง ${type.maxTicketQTY} ใบ`);
            }
            if (type.sold + quantity > type.quota) {
                throw new ApiError("QUOTA_EXCEEDED", `${type.name} คงเหลือไม่เพียงพอ`, 409);
            }
            const attendees = Array.from({ length: quantity }, (_, i) => validateAttendee(selection.attendees[i] ?? {}, type, event));
            return { type, attendees };
        });

        const souvenirItems = priceSouvenirs(input.souvenirItems, event);
        const hasSouvenir = souvenirItems.length > 0 || lines.some((line) => line.attendees.some((attendee) => attendee.receiveSouvenir));
        if (input.deliveryMethod === DELIVERY_METHODS.SHIPPING && (!event.allowShipping || !hasSouvenir)) {
            invalidOrder("คำสั่งซื้อนี้ไม่สามารถจัดส่งของที่ระลึกได้");
        }
        const shipping = input.deliveryMethod === DELIVERY_METHODS.SHIPPING ? validateShipping(input.shipping) : null;
        const deliveryMethod = shipping ? DELIVERY_METHODS.SHIPPING : hasSouvenir ? DELIVERY_METHODS.PICKUP : DELIVERY_METHODS.NONE;
        const shippingFee = shipping ? Number(event.shippingFee) : 0;
        const ticketTotal = lines.reduce((sum, { type, attendees }) => sum + Math.round(Number(type.price) * 100) * attendees.length, 0);
        const souvenirTotal = souvenirItems.reduce((sum, item) => sum + Math.round(Number(item.unitPrice) * 100) * item.quantity, 0);
        const totalMinor = ticketTotal + souvenirTotal + Math.round(shippingFee * 100);
        if (!Number.isSafeInteger(totalMinor) || totalMinor < 0 || totalMinor > 9_999_999_999) invalidOrder("ยอดคำสั่งซื้อไม่ถูกต้อง");
        const free = totalMinor === 0;
        if (requestId && !free && !checkoutPaymentQr()) throw new ApiError("PAYMENT_UNAVAILABLE", "ผู้จัดงานยังไม่ได้ตั้งค่า QR ชำระเงิน", 409);
        const savedOrder = manager.create(Order, {
            id: requestId ?? crypto.randomUUID(),
            orderNo: `ORD-${crypto.randomUUID().toUpperCase()}`,
            userId,
            eventId: event.id,
            total: (totalMinor / 100).toFixed(2),
            status: free ? ORDER_STATUSES.PAID : ORDER_STATUSES.PENDING,
            paymentSlip: free ? null : slip,
            paidAt: free ? new Date() : null,
            deliveryMethod,
            shippingFee: shippingFee.toFixed(2),
            souvenirItems,
        });
        await manager.insert(Order, savedOrder);
        if (shipping) await manager.save(manager.create(OrderShipping, { ...shipping, orderId: savedOrder.id }));

        for (const { type, attendees } of lines) type.sold += attendees.length;
        await manager.save(types);
        await manager.save(lines.flatMap(({ type, attendees }) => attendees.map((attendee) => manager.create(Ticket, {
            ...attendee,
            orderId: savedOrder.id,
            eventId: event.id,
            eventTicketId: type.id,
            userId,
            unitPrice: type.price,
            ticketCode: `TKT-${crypto.randomUUID().toUpperCase()}`,
            qrToken: crypto.randomUUID(),
            status: free ? TICKET_STATUSES.ACTIVE : TICKET_STATUSES.PENDING,
        }))));
        return savedOrder;
    });

    return getMyOrder(userId, order.id);
}

export async function getMyOrder(userId: string, id: string): Promise<OrderDetail> {
    if (!uuidPattern.test(id)) throw new ApiError("ORDER_NOT_FOUND", "ไม่พบคำสั่งซื้อ", 404);
    await releaseExpiredOrderHolds({ id, userId });
    const db = await getDatabase();
    const order = await db.getRepository(Order).findOne({ where: { id, userId }, relations: orderRelations });
    if (!order) throw new ApiError("ORDER_NOT_FOUND", "ไม่พบคำสั่งซื้อ", 404);
    return toOrderDetail(order);
}

export async function submitOrderPayment(userId: string, id: string, proof: unknown): Promise<OrderDetail> {
    if (!uuidPattern.test(id)) throw new ApiError("ORDER_NOT_FOUND", "ไม่พบคำสั่งซื้อ", 404);
    const paymentSlip = validatePaymentSlip(proof);
    const db = await getDatabase();
    await releaseExpiredOrderHolds({ id, userId });
    await db.transaction(async (manager) => {
        const order = await manager.findOne(Order, { where: { id, userId }, lock: { mode: "pessimistic_write" } });
        if (!order) throw new ApiError("ORDER_NOT_FOUND", "ไม่พบคำสั่งซื้อ", 404);
        if (order.paymentSlip === paymentSlip && order.status !== ORDER_STATUSES.CANCELLED) return;
        if (order.status !== ORDER_STATUSES.PENDING || order.paymentSlip || Date.now() >= order.createdAt.getTime() + paymentHoldMs) {
            throw new ApiError("ORDER_NOT_PAYABLE", "คำสั่งซื้อนี้ส่งหลักฐานไปแล้วหรือไม่สามารถชำระได้", 409);
        }
        await manager.update(Order, { id }, { paymentSlip });
    });
    return getMyOrder(userId, id);
}

async function cancelPendingOrders(manager: EntityManager, ids: string[]) {
    const tickets = await manager.findBy(Ticket, { orderId: In(ids), status: TICKET_STATUSES.PENDING });
    const counts = new Map<string, number>();
    for (const ticket of tickets) counts.set(ticket.eventTicketId, (counts.get(ticket.eventTicketId) ?? 0) + 1);
    for (const [typeId, count] of [...counts].sort(([first], [second]) => first.localeCompare(second))) {
        await manager.decrement(EventTicket, { id: typeId }, "sold", count);
    }
    await manager.update(Order, { id: In(ids) }, { status: ORDER_STATUSES.CANCELLED, paidAt: null });
    await manager.update(Ticket, { orderId: In(ids), status: TICKET_STATUSES.PENDING }, { status: TICKET_STATUSES.CANCELLED });
}

export async function releaseExpiredOrderHolds(scope: { id?: string; eventId?: string; userId?: string }) {
    const db = await getDatabase();
    return db.transaction(async (manager) => {
        const expired = await manager.find(Order, {
            select: { id: true },
            where: { ...scope, status: ORDER_STATUSES.PENDING, paymentSlip: IsNull(), createdAt: LessThanOrEqual(new Date(Date.now() - paymentHoldMs)) },
            order: { id: "ASC" },
            lock: { mode: "pessimistic_write" },
        });
        if (expired.length) await cancelPendingOrders(manager, expired.map((order) => order.id));
        return expired.length;
    });
}

export async function cancelMyOrder(userId: string, id: string) {
    if (!uuidPattern.test(id)) throw new ApiError("ORDER_NOT_FOUND", "ไม่พบคำสั่งซื้อ", 404);
    const db = await getDatabase();
    await db.transaction(async (manager) => {
        const order = await manager.findOne(Order, { where: { id, userId }, lock: { mode: "pessimistic_write" } });
        if (!order) throw new ApiError("ORDER_NOT_FOUND", "ไม่พบคำสั่งซื้อ", 404);
        if (order.status === ORDER_STATUSES.CANCELLED) return;
        if (order.status !== ORDER_STATUSES.PENDING || order.paymentSlip) {
            throw new ApiError("ORDER_STATUS_CHANGED", "สถานะคำสั่งซื้อเปลี่ยนแล้ว กรุณาเปิดรายการอีกครั้ง", 409);
        }
        await cancelPendingOrders(manager, [id]);
    });
}

export async function getMyOrders(userId: string): Promise<OrderDetail[]> {
    await releaseExpiredOrderHolds({ userId });
    const db = await getDatabase();
    const orders = await db.getRepository(Order).find({
        where: { userId },
        relations: orderRelations,
        order: { createdAt: "DESC" },
    });
    return orders.map(toOrderDetail);
}

export async function getMyTickets(userId: string): Promise<TicketItem[]> {
    await releaseExpiredOrderHolds({ userId });
    const db = await getDatabase();
    const tickets = await db.getRepository(Ticket).find({
        where: { userId },
        relations: { eventTicket: true },
        order: { createdAt: "DESC" },
    });
    return tickets.map(toTicketItem);
}

export async function scanTicket(staffUserId: string, qrToken: string): Promise<TicketItem> {
    const db = await getDatabase();
    const repo = db.getRepository(Ticket);
    const ticket = await repo.findOneBy({ qrToken });

    if (!ticket) throw new ApiError("TICKET_NOT_FOUND", "ไม่พบบัตรในระบบ", 404);
    if (ticket.status === TICKET_STATUSES.USED) {
        throw new ApiError("TICKET_ALREADY_USED", "บัตรนี้ถูกสแกนเข้างานไปแล้ว", 409);
    }
    if (ticket.status !== TICKET_STATUSES.ACTIVE) {
        throw new ApiError("TICKET_NOT_ACTIVE", "บัตรยังไม่ได้ชำระเงินหรือถูกยกเลิก", 400);
    }

    ticket.status = TICKET_STATUSES.USED;
    ticket.checkedInAt = new Date();
    ticket.checkedInById = staffUserId;

    return toTicketItem(await repo.save(ticket));
}
