import "server-only";
import type { CreateOrderInput, OrderDetail, TicketItem } from "@/lib/api-types";
import { getDatabase } from "@/server/database/database.souce";
import { Events, EventTicket, Order, OrderShipping, Ticket, User } from "@/server/database/entities";
import { DELIVERY_METHODS, ORDER_STATUSES, TICKET_STATUSES } from "@/server/database/enums/domain.enum";
import { ApiError } from "@/server/http/errors";
import { In, IsNull, LessThanOrEqual, type EntityManager } from "typeorm";
import { invalidOrder, priceSouvenirs, validateAttendee, validatePaymentSlip, validateShipping } from "@/server/services/order-validation";
import { hasCheckoutPromptPay } from "@/server/services/checkout-payment";
import { getEventSouvenirs } from "./event-souvenirs";
import { toTicketItem } from "./ticket.service";

const uuidPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const orderRelations = { shipping: true, tickets: { eventTicket: true } } as const;
const paymentHoldMs = 30 * 60 * 1000;

function readOrderRequest(input: CreateOrderInput) {
    if (!input || typeof input.eventId !== "string" || !uuidPattern.test(input.eventId)) invalidOrder("ข้อมูลงานไม่ถูกต้อง");
    if (!Object.values(DELIVERY_METHODS).includes(input.deliveryMethod)) invalidOrder("วิธีรับของที่ระลึกไม่ถูกต้อง");

    const { requestId, items: ticketChoices } = input;
    if (typeof requestId !== "string" || !uuidPattern.test(requestId)) invalidOrder("รหัสคำสั่งซื้อไม่ถูกต้อง");

    if (!Array.isArray(ticketChoices) || ticketChoices.length === 0 || ticketChoices.length > 100) invalidOrder("กรุณาเลือกบัตร");
    for (const choice of ticketChoices) {
        if (!choice || typeof choice.eventTicketId !== "string" || !uuidPattern.test(choice.eventTicketId)) {
            invalidOrder("ประเภทบัตรไม่ถูกต้อง");
        }
        if (!Number.isSafeInteger(choice.quantity) || choice.quantity < 1) invalidOrder("จำนวนบัตรไม่ถูกต้อง");
        if (!Array.isArray(choice.attendees) || choice.attendees.length !== choice.quantity) {
            invalidOrder("จำนวนบัตรหรือข้อมูลผู้เข้าร่วมไม่ถูกต้อง");
        }
    }

    const ticketTypeIds = ticketChoices.map((choice) => choice.eventTicketId);
    if (new Set(ticketTypeIds).size !== ticketTypeIds.length) invalidOrder("พบประเภทบัตรซ้ำในคำสั่งซื้อ");
    return { requestId, ticketChoices, ticketTypeIds };
}

export async function createOrder(userId: string, input: CreateOrderInput): Promise<OrderDetail> {
    const { requestId, ticketChoices, ticketTypeIds } = readOrderRequest(input);
    const db = await getDatabase();
    await releaseExpiredOrderHolds({ eventId: input.eventId });

    const orderId = await db.transaction(async (manager) => {
        // ถ้ากดส่งซ้ำด้วยรหัสเดิม ให้เปิดออเดอร์ที่สร้างไว้แล้ว
        await manager.findOne(User, { where: { id: userId }, lock: { mode: "pessimistic_write" } });
        const existingOrder = await manager.findOneBy(Order, { id: requestId, userId });
        if (existingOrder) return existingOrder.id;

        const event = await manager.findOneBy(Events, { id: input.eventId });
        if (!event) throw new ApiError("EVENT_NOT_FOUND", "ไม่พบงานที่ต้องการ", 404);
        const now = Date.now();
        if (now < event.buyAt.getTime() || now >= event.buyEndAt.getTime()) {
            throw new ApiError("SALES_CLOSED", "ขณะนี้อยู่นอกช่วงจำหน่ายบัตร", 409);
        }
        const totalTickets = ticketChoices.reduce((total, choice) => total + choice.quantity, 0);
        if (totalTickets < event.minTicketQTY || totalTickets > event.maxTicketQTY) {
            invalidOrder(`กรุณาเลือกบัตรระหว่าง ${event.minTicketQTY} ถึง ${event.maxTicketQTY} ใบ`);
        }

        // ล็อกประเภทบัตรไว้ระหว่างเช็กโควตา
        const ticketTypes = await manager.find(EventTicket, {
            where: { id: In(ticketTypeIds), eventId: event.id, isActive: true },
            order: { id: "ASC" },
            lock: { mode: "pessimistic_write" },
        });
        const eventSouvenirs = await getEventSouvenirs(manager, event.id);
        const bookedTicketTypes = ticketChoices.map((choice) => {
            const ticketType = ticketTypes.find((type) => type.id === choice.eventTicketId);
            if (!ticketType) throw new ApiError("TICKET_NOT_FOUND", "ไม่พบประเภทบัตรที่เปิดจำหน่าย", 404);

            if (choice.quantity < ticketType.minTicketQTY || choice.quantity > ticketType.maxTicketQTY) {
                invalidOrder(`กรุณาเลือก ${ticketType.name} ระหว่าง ${ticketType.minTicketQTY} ถึง ${ticketType.maxTicketQTY} ใบ`);
            }
            if (choice.quantity > ticketType.quota - ticketType.sold) {
                throw new ApiError("QUOTA_EXCEEDED", `${ticketType.name} คงเหลือไม่เพียงพอ`, 409);
            }

            const attendees = [];
            for (let index = 0; index < choice.quantity; index++) {
                const attendee = validateAttendee(choice.attendees[index], ticketType, eventSouvenirs);
                attendees.push(attendee);
            }
            return { ticketType, attendees };
        });

        const souvenirItems = priceSouvenirs(input.souvenirItems, eventSouvenirs);
        const orderHasSouvenirs = souvenirItems.length > 0
            || bookedTicketTypes.some(({ attendees }) => attendees.some((attendee) => attendee.souvenirItems.length > 0));
        const wantsShipping = input.deliveryMethod === DELIVERY_METHODS.SHIPPING;
        if (wantsShipping && (!event.allowShipping || !orderHasSouvenirs)) {
            invalidOrder("คำสั่งซื้อนี้ไม่สามารถจัดส่งของที่ระลึกได้");
        }
        const shippingAddress = wantsShipping ? validateShipping(input.shipping) : null;
        let deliveryMethod: Order["deliveryMethod"] = DELIVERY_METHODS.NONE;
        if (shippingAddress) {
            deliveryMethod = DELIVERY_METHODS.SHIPPING;
        } else if (orderHasSouvenirs) {
            deliveryMethod = DELIVERY_METHODS.PICKUP;
        }

        const shippingFee = shippingAddress ? Number(event.shippingFee) : 0;
        let totalSatang = Math.round(shippingFee * 100);
        for (const { ticketType, attendees } of bookedTicketTypes) {
            totalSatang += Math.round(Number(ticketType.price) * 100) * attendees.length;
        }
        for (const item of souvenirItems) {
            totalSatang += Math.round(Number(item.unitPrice) * 100) * item.quantity;
        }
        if (!Number.isSafeInteger(totalSatang) || totalSatang < 0 || totalSatang > 9_999_999_999) {
            invalidOrder("ยอดคำสั่งซื้อไม่ถูกต้อง");
        }
        const isFree = totalSatang === 0;
        if (!isFree && !hasCheckoutPromptPay()) {
            throw new ApiError("PAYMENT_UNAVAILABLE", "ผู้จัดงานยังไม่ได้ตั้งค่า QR ชำระเงิน", 409);
        }

        const order = manager.create(Order, {
            id: requestId,
            orderNo: `ORD-${crypto.randomUUID().toUpperCase()}`,
            userId,
            eventId: event.id,
            total: (totalSatang / 100).toFixed(2),
            status: isFree ? ORDER_STATUSES.PAID : ORDER_STATUSES.PENDING,
            paymentSlip: null,
            paidAt: isFree ? new Date() : null,
            deliveryMethod,
            shippingFee: shippingFee.toFixed(2),
            souvenirItems,
        });
        await manager.insert(Order, order);
        if (shippingAddress) {
            await manager.insert(OrderShipping, { ...shippingAddress, orderId: order.id });
        }

        const tickets: Ticket[] = [];
        for (const { ticketType, attendees } of bookedTicketTypes) {
            ticketType.sold += attendees.length;
            for (const attendee of attendees) {
                tickets.push(manager.create(Ticket, {
                    ...attendee,
                    orderId: order.id,
                    eventId: event.id,
                    eventTicketId: ticketType.id,
                    userId,
                    unitPrice: ticketType.price,
                    ticketCode: `TKT-${crypto.randomUUID().toUpperCase()}`,
                    qrToken: crypto.randomUUID(),
                    status: isFree ? TICKET_STATUSES.ACTIVE : TICKET_STATUSES.PENDING,
                }));
            }
        }
        await manager.save(ticketTypes);
        await manager.save(tickets);
        return order.id;
    });

    return getMyOrder(userId, orderId);
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

export async function cancelPendingOrders(manager: EntityManager, ids: string[]) {
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

export function toOrderDetail(order: Order): OrderDetail {
    const shipping = order.shipping;
    const waitingForPayment = order.status === ORDER_STATUSES.PENDING && !order.paymentSlip;
    return {
        id: order.id,
        orderNo: order.orderNo,
        userId: order.userId,
        eventId: order.eventId,
        total: order.total,
        status: order.status,
        paymentSlip: order.paymentSlip?.startsWith("data:") ? null : order.paymentSlip,
        hasPaymentSlip: Boolean(order.paymentSlip),
        paymentDueAt: waitingForPayment
            ? new Date(order.createdAt.getTime() + paymentHoldMs).toISOString()
            : undefined,
        paidAt: order.paidAt ? order.paidAt.toISOString() : null,
        deliveryMethod: order.deliveryMethod,
        shippingFee: order.shippingFee,
        souvenirItems: order.souvenirItems ?? [],
        shipping: shipping
            ? {
                id: shipping.id,
                orderId: shipping.orderId,
                recipientName: shipping.recipientName,
                recipientPhone: shipping.recipientPhone,
                addressLine: shipping.addressLine,
                subDistrict: shipping.subDistrict,
                district: shipping.district,
                province: shipping.province,
                postalCode: shipping.postalCode,
                note: shipping.note,
                status: shipping.status,
                carrier: shipping.carrier,
                trackingNumber: shipping.trackingNumber,
                shippedAt: shipping.shippedAt ? shipping.shippedAt.toISOString() : null,
                createdAt: shipping.createdAt.toISOString(),
                updatedAt: shipping.updatedAt.toISOString(),
            }
            : null,
        tickets: (order.tickets ?? []).map(toTicketItem),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
    };
}
