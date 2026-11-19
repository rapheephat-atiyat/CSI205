import "server-only";
import type { OverviewReport, WalletHistoryItem } from "@/lib/api-types";
import { getDatabase } from "@/server/database/database.souce";
import { EventTicket, Order, Ticket, WalletHistory } from "@/server/database/entities";
import { ORDER_STATUSES, TICKET_STATUSES, TRANSACTION_STATUSES, TRANSACTION_TYPES } from "@/server/database/enums/domain.enum";
import { Not, IsNull } from "typeorm";
import { toWalletHistoryItem } from "./wallet.service";

export async function getOverviewReport(): Promise<OverviewReport> {
    const db = await getDatabase();

    const ticketTypes = await db.getRepository(EventTicket).find();
    const totalTicketsSold = ticketTypes.reduce((sum, ticketType) => sum + ticketType.sold, 0);

    const totalCheckedIn = await db.getRepository(Ticket).count({
        where: { status: TICKET_STATUSES.USED },
    });

    const paidOrders = await db.getRepository(Order).find({
        where: { status: ORDER_STATUSES.PAID },
    });
    const totalTicketRevenue = paidOrders
        .reduce((sum, order) => sum + Number(order.total), 0)
        .toFixed(2);

    const storePurchases = await db.getRepository(WalletHistory).find({
        where: {
            type: TRANSACTION_TYPES.PURCHASE,
            status: TRANSACTION_STATUSES.COMPLETED,
            wallet: { storeId: Not(IsNull()) },
        },
    });
    const totalStoreVolume = storePurchases.reduce((sum, purchase) => sum + Number(purchase.amount), 0).toFixed(2);

    return {
        totalTicketsSold,
        totalCheckedIn,
        totalTicketRevenue,
        totalStoreVolume,
    };
}

export async function getAuditLogs(): Promise<WalletHistoryItem[]> {
    const db = await getDatabase();
    const histories = await db.getRepository(WalletHistory).find({
        order: { createdAt: "DESC" },
        take: 100,
    });

    return histories.map(toWalletHistoryItem);
}
