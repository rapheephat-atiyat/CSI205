import "server-only";
import type { AdminOrderDetail, AdminOrderFilters, AdminOrderSummary, OrderReviewInput, OrderShippingUpdate, Paginated } from "@/lib/api-types";
import { getDatabase } from "@/server/database/database.souce";
import { Order, OrderShipping, Ticket } from "@/server/database/entities";
import { ORDER_STATUSES, SHIPPING_STATUSES, TICKET_STATUSES } from "@/server/database/enums/domain.enum";
import { ApiError } from "@/server/http/errors";
import { readText, readUuid } from "@/server/http/validation";
import { cancelPendingOrders, releaseExpiredOrderHolds, toOrderDetail } from "./order.service";
import { validatePaymentSlip } from "./order-validation";
import { recordAdminActivity } from "./admin-activity";
import { awardTicketTokens } from "./wallet.service";

export async function listAdminOrders(eventId: string, filters: AdminOrderFilters): Promise<Paginated<AdminOrderSummary>> {
    if (filters.status && !Object.values(ORDER_STATUSES).includes(filters.status)) throw new ApiError("VALIDATION_ERROR", "สถานะไม่ถูกต้อง", 422);
    const page = Number(filters.page ?? 1);
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000 || (filters.query?.length ?? 0) > 100) throw new ApiError("VALIDATION_ERROR", "ตัวกรองไม่ถูกต้อง", 422);
    await releaseExpiredOrderHolds({ eventId });
    const db = await getDatabase();
    const query = db.getRepository(Order).createQueryBuilder("o").innerJoin("o.user", "buyer")
        .where("o.eventId = :eventId", { eventId });
    if (filters.status) query.andWhere("o.status = :status", { status: filters.status });
    if (filters.review === "pending") query.andWhere("o.status = :pending AND o.paymentSlip IS NOT NULL", { pending: ORDER_STATUSES.PENDING });
    if (filters.query?.trim()) query.andWhere("(o.orderNo ILIKE :query OR buyer.name ILIKE :query OR buyer.email ILIKE :query)", { query: `%${filters.query.trim().replace(/[\\%_]/g, "\\$&")}%` });
    const total = await query.getCount();
    const rows = await query.select([
        'o.id AS "id"', 'o.orderNo AS "orderNo"', 'o.eventId AS "eventId"', 'o.userId AS "userId"',
        'buyer.name AS "buyerName"', 'buyer.email AS "buyerEmail"', 'o.total AS "total"', 'o.status AS "status"',
        'o.createdAt AS "createdAt"', 'o.reviewDecision AS "reviewDecision"', 'o.reviewedAt AS "reviewedAt"',
        '(o.paymentSlip IS NOT NULL) AS "hasPaymentSlip"',
        '(SELECT COUNT(*) FROM tickets t WHERE t.order_id = o.id) AS "ticketCount"',
    ]).orderBy("o.createdAt", "DESC").addOrderBy("o.id", "DESC").limit(20).offset((page - 1) * 20)
        .getRawMany<Omit<AdminOrderSummary, "createdAt" | "reviewedAt" | "ticketCount"> & { createdAt: Date; reviewedAt: Date | null; ticketCount: string }>();
    return { total, page, pageSize: 20, items: rows.map((row) => ({ ...row, ticketCount: Number(row.ticketCount), createdAt: row.createdAt.toISOString(), reviewedAt: row.reviewedAt?.toISOString() ?? null })) };
}

export async function getAdminOrder(eventId: string, orderId: string): Promise<AdminOrderDetail> {
    readUuid(orderId, "รหัสคำสั่งซื้อ");
    await releaseExpiredOrderHolds({ eventId, id: orderId });
    const db = await getDatabase();
    const order = await db.getRepository(Order).findOne({ where: { id: orderId, eventId }, relations: { user: true, shipping: true, tickets: { eventTicket: true } } });
    if (!order) throw new ApiError("ORDER_NOT_FOUND", "ไม่พบคำสั่งซื้อในงานนี้", 404);
    return {
        ...toOrderDetail(order),
        buyer: { id: order.user.id, name: order.user.name, email: order.user.email, phone: order.user.phone },
        review: order.reviewDecision && order.reviewedAt ? { decision: order.reviewDecision, actorId: order.reviewedById, at: order.reviewedAt.toISOString(), reason: order.reviewReason } : null,
    };
}

export async function getAdminPaymentSlip(eventId: string, orderId: string) {
    readUuid(orderId, "รหัสคำสั่งซื้อ");
    const order = await (await getDatabase()).getRepository(Order).findOne({ where: { id: orderId, eventId }, select: { id: true, paymentSlip: true } });
    if (!order?.paymentSlip) throw new ApiError("SLIP_NOT_FOUND", "ยังไม่มีหลักฐานชำระเงิน", 404);
    const proof = validatePaymentSlip(order.paymentSlip);
    const separator = proof.indexOf(",");
    return { type: proof.slice(5, proof.indexOf(";")), file: Buffer.from(proof.slice(separator + 1), "base64") };
}

export async function reviewAdminOrder(eventId: string, orderId: string, actorId: string, input: OrderReviewInput) {
    readUuid(orderId, "รหัสคำสั่งซื้อ");
    if (!["APPROVE", "REJECT"].includes(input.decision)) throw new ApiError("VALIDATION_ERROR", "ผลการตรวจไม่ถูกต้อง", 422);
    const reason = input.decision === "REJECT" ? readText(input.reason, "เหตุผลที่ไม่อนุมัติ", 500)
        : input.reason == null || input.reason === "" ? null : readText(input.reason, "หมายเหตุ", 500);
    const db = await getDatabase();
    await db.transaction(async (manager) => {
        const order = await manager.findOne(Order, { where: { id: orderId, eventId }, lock: { mode: "pessimistic_write" } });
        if (!order) throw new ApiError("ORDER_NOT_FOUND", "ไม่พบคำสั่งซื้อในงานนี้", 404);
        // The locked decision is the idempotency record. Concurrent repeats cannot issue tickets twice.
        if (order.reviewDecision === input.decision) return;
        if (order.status !== ORDER_STATUSES.PENDING || order.reviewDecision) throw new ApiError("ORDER_STATUS_CHANGED", "คำสั่งซื้อนี้ถูกตรวจหรือยกเลิกแล้ว", 409);
        if (!order.paymentSlip) throw new ApiError("PAYMENT_PROOF_REQUIRED", "ยังไม่มีหลักฐานให้ตรวจสอบ", 409);
        const pendingTickets = await manager.find(Ticket, {
            where: { orderId, status: TICKET_STATUSES.PENDING },
            select: { tokenReward: true },
        });
        if (!pendingTickets.length) throw new ApiError("ORDER_NOT_REVIEWABLE", "ไม่มีบัตรรออนุมัติในคำสั่งซื้อ", 409);
        if (input.decision === "APPROVE") {
            await manager.update(Ticket, { orderId, status: TICKET_STATUSES.PENDING }, { status: TICKET_STATUSES.ACTIVE });
            order.status = ORDER_STATUSES.PAID;
            order.paidAt = new Date();
            await awardTicketTokens(manager, order.userId, order.id, pendingTickets);
        } else {
            await cancelPendingOrders(manager, [orderId]);
            order.status = ORDER_STATUSES.CANCELLED;
            order.paidAt = null;
        }
        order.reviewDecision = input.decision;
        order.reviewedById = actorId;
        order.reviewedAt = new Date();
        order.reviewReason = reason;
        await manager.save(order);
        await recordAdminActivity(manager, actorId, eventId, input.decision === "APPROVE" ? "order.approve" : "order.reject", orderId, reason);
    });
    return getAdminOrder(eventId, orderId);
}

export async function updateAdminShipping(eventId: string, orderId: string, actorId: string, input: OrderShippingUpdate) {
    readUuid(orderId, "รหัสคำสั่งซื้อ");
    const statuses = Object.values(SHIPPING_STATUSES);
    if (!statuses.includes(input.status)) throw new ApiError("VALIDATION_ERROR", "สถานะจัดส่งไม่ถูกต้อง", 422);
    const db = await getDatabase();
    await db.transaction(async (manager) => {
        const order = await manager.findOne(Order, { where: { id: orderId, eventId }, lock: { mode: "pessimistic_write" } });
        if (!order) throw new ApiError("ORDER_NOT_FOUND", "ไม่พบคำสั่งซื้อในงานนี้", 404);
        if (order.status !== ORDER_STATUSES.PAID) throw new ApiError("ORDER_NOT_PAID", "ต้องอนุมัติชำระเงินก่อนจัดส่ง", 409);
        const shipping = await manager.findOneBy(OrderShipping, { orderId });
        if (!shipping) throw new ApiError("SHIPPING_NOT_FOUND", "คำสั่งซื้อนี้ไม่มีการจัดส่ง", 404);
        if (statuses.indexOf(input.status) < statuses.indexOf(shipping.status)) throw new ApiError("SHIPPING_STATUS_CHANGED", "ไม่สามารถย้อนสถานะจัดส่งได้", 409);
        const needsTracking = input.status === SHIPPING_STATUSES.SHIPPED || input.status === SHIPPING_STATUSES.DELIVERED;
        const carrier = input.carrier === undefined ? shipping.carrier : input.carrier;
        const tracking = input.trackingNumber === undefined ? shipping.trackingNumber : input.trackingNumber;
        shipping.carrier = needsTracking ? readText(carrier, "ขนส่ง", 100) : carrier ? readText(carrier, "ขนส่ง", 100) : null;
        shipping.trackingNumber = needsTracking ? readText(tracking, "เลขติดตาม", 100) : tracking ? readText(tracking, "เลขติดตาม", 100) : null;
        shipping.status = input.status;
        if (needsTracking && !shipping.shippedAt) shipping.shippedAt = new Date();
        await manager.save(shipping);
        await recordAdminActivity(manager, actorId, eventId, "shipping.update", orderId, input.status);
    });
    return getAdminOrder(eventId, orderId);
}
