import "server-only";
import type { OverviewReport, WalletHistoryItem } from "@/lib/api-types";
import { getDatabase } from "@/server/database/database.souce";
import { EventTicket, Order, Ticket, WalletHistory } from "@/server/database/entities";
import { ORDER_STATUSES, TICKET_STATUSES, TRANSACTION_TYPES } from "@/server/database/enums/domain.enum";

export async function getOverviewReport(): Promise<OverviewReport> {
    const db = await getDatabase();

    const ticketTypes = await db.getRepository(EventTicket).find();
    const totalTicketsSold = ticketTypes.reduce((sum, t) => sum + t.sold, 0);

    const totalCheckedIn = await db.getRepository(Ticket).count({
        where: { status: TICKET_STATUSES.USED },
    });

    const paidOrders = await db.getRepository(Order).find({
        where: { status: ORDER_STATUSES.PAID },
    });
    const totalTicketRevenue = paidOrders
        .reduce((sum, o) => sum + Number(o.total), 0)
        .toFixed(2);

    const storePurchases = await db.getRepository(WalletHistory).find({
        where: { type: TRANSACTION_TYPES.PURCHASE },
    });
    const totalStoreVolume = (
        storePurchases.reduce((sum, h) => sum + Number(h.amount), 0) / 2
    ).toFixed(2);

    return {
        totalTicketsSold,
        totalCheckedIn,
        totalTicketRevenue,
        totalStoreVolume,
    };
}

export async function getAuditLogs(): Promise<WalletHistoryItem[]> {
    const db = await getDatabase();
    const list = await db.getRepository(WalletHistory).find({
        order: { createdAt: "DESC" },
        take: 100,
    });

    return list.map((h) => ({
        id: h.id,
        walletId: h.walletId,
        type: h.type,
        status: h.status,
        amount: h.amount,
        before: h.before,
        after: h.after,
        ref: h.ref,
        note: h.note,
        createdAt: h.createdAt.toISOString(),
    }));
}