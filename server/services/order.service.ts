import "server-only";
import type { CreateOrderInput, OrderDetail, TicketItem } from "@/lib/api-types";
import { getDatabase } from "@/server/database/database.souce";
import { Events, EventTicket, Order, OrderShipping, Ticket } from "@/server/database/entities";
import { DELIVERY_METHODS, ORDER_STATUSES, TICKET_STATUSES } from "@/server/database/enums/domain.enum";
import { ApiError } from "@/server/http/errors";

function toTicketItem(t: Ticket): TicketItem {
    return {
        id: t.id,
        orderId: t.orderId,
        eventId: t.eventId,
        eventTicketId: t.eventTicketId,
        userId: t.userId,
        unitPrice: t.unitPrice,
        ticketCode: t.ticketCode,
        qrToken: t.qrToken,
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
        paymentSlip: o.paymentSlip,
        paidAt: o.paidAt ? o.paidAt.toISOString() : null,
        deliveryMethod: o.deliveryMethod,
        shippingFee: o.shippingFee,
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
    if (input.quantity <= 0) throw new ApiError("VALIDATION_ERROR", "จำนวนบัตรต้องมากกว่า 0", 422);

    const db = await getDatabase();
    const orderId = await db.transaction(async (manager) => {
        const event = await manager.findOneBy(Events, { id: input.eventId });
        if (!event) throw new ApiError("EVENT_NOT_FOUND", "ไม่พบงานที่ต้องการ", 404);

        const ticketType = await manager.findOne(EventTicket, {
            where: { id: input.eventTicketId, eventId: input.eventId, isActive: true },
            lock: { mode: "pessimistic_write" },
        });
        if (!ticketType) throw new ApiError("TICKET_NOT_FOUND", "ไม่พบประเภทบัตรที่เปิดจำหน่าย", 404);

        if (ticketType.sold + input.quantity > ticketType.quota) {
            throw new ApiError("QUOTA_EXCEEDED", "บัตรหมดหรือจำนวนคงเหลือไม่เพียงพอ", 400);
        }

        ticketType.sold += input.quantity;
        await manager.save(ticketType);

        const shippingFee = input.deliveryMethod === DELIVERY_METHODS.SHIPPING ? Number(event.shippingFee || 0) : 0;
        const ticketTotal = Number(ticketType.price) * input.quantity;
        const total = (ticketTotal + shippingFee).toFixed(2);

        const isPaid = Boolean(input.paymentSlip);
        const order = manager.create(Order, {
            orderNo: `ORD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            userId,
            eventId: input.eventId,
            total,
            status: isPaid ? ORDER_STATUSES.PAID : ORDER_STATUSES.PENDING,
            paymentSlip: input.paymentSlip ?? null,
            paidAt: isPaid ? new Date() : null,
            deliveryMethod: input.deliveryMethod,
            shippingFee: shippingFee.toFixed(2),
        });
        const savedOrder = await manager.save(order);

        if (input.deliveryMethod === DELIVERY_METHODS.SHIPPING && input.shipping) {
            const shipping = manager.create(OrderShipping, {
                orderId: savedOrder.id,
                recipientName: input.shipping.recipientName,
                recipientPhone: input.shipping.recipientPhone,
                addressLine: input.shipping.addressLine,
                subDistrict: input.shipping.subDistrict,
                district: input.shipping.district,
                province: input.shipping.province,
                postalCode: input.shipping.postalCode,
                note: input.shipping.note ?? null,
            });
            await manager.save(shipping);
        }

        const tickets = Array.from({ length: input.quantity }).map((_, idx) => {
            const att = input.attendees?.[idx] ?? {};
            return manager.create(Ticket, {
                orderId: savedOrder.id,
                eventId: input.eventId,
                eventTicketId: ticketType.id,
                userId,
                unitPrice: ticketType.price,
                ticketCode: `TKT-${Date.now().toString(36).toUpperCase()}-${idx + 1}`,
                qrToken: crypto.randomUUID(),
                status: isPaid ? TICKET_STATUSES.ACTIVE : TICKET_STATUSES.PENDING,
                firstName: att.firstName ?? null,
                lastName: att.lastName ?? null,
                phone: att.phone ?? null,
                email: att.email ?? null,
                graduationYear: att.graduationYear ?? null,
                receiveSouvenir: att.receiveSouvenir ?? false,
                souvenirSize: att.souvenirSize ?? null,
            });
        });
        await manager.save(tickets);

        return savedOrder.id;
    });

    const fullOrder = await db.getRepository(Order).findOne({
        where: { id: orderId },
        relations: { shipping: true, tickets: true },
    });
    return toOrderDetail(fullOrder!);
}

export async function getMyOrders(userId: string): Promise<OrderDetail[]> {
    const db = await getDatabase();
    const orders = await db.getRepository(Order).find({
        where: { userId },
        relations: { shipping: true, tickets: true },
        order: { createdAt: "DESC" },
    });
    return orders.map(toOrderDetail);
}

export async function getMyTickets(userId: string): Promise<TicketItem[]> {
    const db = await getDatabase();
    const tickets = await db.getRepository(Ticket).find({
        where: { userId },
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