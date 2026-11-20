import "server-only";
import type { WalletDetail, WalletHistoryItem, WalletTransactionInput } from "@/lib/api-types";
import { calculateTopUpBaht } from "@/lib/token-pricing";
import { getDatabase } from "@/server/database/database.souce";
import { User, Wallet, WalletHistory } from "@/server/database/entities";
import { TOKEN_PRICING_ID, TokenPricing } from "@/server/database/entities/TokenPricing";
import { TRANSACTION_STATUSES, TRANSACTION_TYPES } from "@/server/database/enums/domain.enum";
import { ApiError } from "@/server/http/errors";
import type { EntityManager } from "typeorm";
import { readMoney } from "./money";

export async function getUserWallet(userId: string): Promise<WalletDetail> {
    const db = await getDatabase();
    const walletRepo = db.getRepository(Wallet);
    let wallet = await walletRepo.findOne({
        where: { userId },
        relations: { walletHistories: true },
    });

    if (!wallet) {
        await createMissingWallet(db.manager, userId);
        wallet = await walletRepo.findOneOrFail({ where: { userId }, relations: { walletHistories: true } });
    }

    return {
        id: wallet.id,
        userId: wallet.userId,
        storeId: wallet.storeId,
        total: wallet.total,
        histories: (wallet.walletHistories ?? [])
            .toSorted((first, second) => second.createdAt.getTime() - first.createdAt.getTime())
            .map(toWalletHistoryItem),
        createdAt: wallet.createdAt.toISOString(),
        updatedAt: wallet.updatedAt.toISOString(),
    };
}

export async function adjustUserWallet(
    staffId: string,
    type: "TOPUP" | "REFUND",
    input: WalletTransactionInput
): Promise<WalletDetail> {
    const amount = readMoney(input.amount);
    if (typeof input.userId !== "string" || !input.userId) {
        throw new ApiError("VALIDATION_ERROR", "กรุณาระบุรหัสผู้ใช้", 422);
    }

    const db = await getDatabase();
    await db.transaction(async (manager) => {
        let bahtPerToken: string | null = null;
        if (type === "TOPUP") {
            const pricing = await manager.findOneOrFail(TokenPricing, {
                where: { id: TOKEN_PRICING_ID },
                lock: { mode: "pessimistic_read" },
            });
            bahtPerToken = pricing.bahtPerToken;
            if (input.expectedBahtPerToken !== undefined
                && readMoney(input.expectedBahtPerToken).toFixed(2) !== bahtPerToken) {
                throw new ApiError("TOKEN_RATE_CHANGED", "อัตรา Token เปลี่ยนแล้ว กรุณาตรวจราคาก่อนเติมอีกครั้ง", 409);
            }
        }
        await recordWalletChange(manager, input.userId, type === "TOPUP" ? amount : -amount, {
            type,
            ref: staffId,
            note: input.note ?? (type === "TOPUP" ? "เติม Token เข้ากระเป๋า" : "คืน Token"),
            bahtPerToken,
            bahtAmount: bahtPerToken === null ? null : calculateTopUpBaht(amount, Number(bahtPerToken)),
        });
    });

    return getUserWallet(input.userId);
}

export async function awardTicketTokens(
    manager: EntityManager,
    userId: string,
    orderId: string,
    tickets: readonly { tokenReward: number }[],
) {
    const reward = tickets.reduce((sum, ticket) => sum + ticket.tokenReward, 0);
    if (reward === 0) return;
    await recordWalletChange(manager, userId, reward, {
        type: TRANSACTION_TYPES.TICKET_REWARD,
        ref: orderId,
        note: "Token จากการจองบัตร",
    });
}

async function recordWalletChange(
    manager: EntityManager,
    userId: string,
    change: number,
    history: Pick<WalletHistory, "type" | "ref" | "note"> & Partial<Pick<WalletHistory, "bahtPerToken" | "bahtAmount">>,
) {
    const walletQuery = { where: { userId }, lock: { mode: "pessimistic_write" } } as const;
    let wallet = await manager.findOne(Wallet, walletQuery);
    if (!wallet) {
        await createMissingWallet(manager, userId);
        wallet = await manager.findOneOrFail(Wallet, walletQuery);
    }
    const before = wallet.total;
    const after = (Math.round(Number(before) * 100) + Math.round(change * 100)) / 100;
    if (after < 0) {
        throw new ApiError("INSUFFICIENT_BALANCE", "ยอด Token คงเหลือไม่พอสำหรับการคืน", 400);
    }
    if (after > 99_999_999.99) {
        throw new ApiError("WALLET_LIMIT_EXCEEDED", "ยอดรวมเกินจำนวน Token ที่กระเป๋ารองรับ", 409);
    }
    wallet.total = after.toFixed(2);
    await manager.save(wallet);
    await manager.insert(WalletHistory, {
        ...history,
        walletId: wallet.id,
        status: TRANSACTION_STATUSES.COMPLETED,
        amount: Math.abs(change).toFixed(2),
        before,
        after: wallet.total,
    });
}

async function createMissingWallet(manager: EntityManager, userId: string) {
    if (!await manager.existsBy(User, { id: userId })) throw new ApiError("USER_NOT_FOUND", "ไม่พบผู้ใช้", 404);
    // ถ้ามีอีกคำขอสร้างกระเป๋าพร้อมกัน ให้ใช้ใบที่สร้างสำเร็จก่อน
    await manager.createQueryBuilder().insert().into(Wallet).values({ userId }).orIgnore().execute();
}

export function toWalletHistoryItem(history: WalletHistory): WalletHistoryItem {
    return {
        id: history.id,
        walletId: history.walletId,
        type: history.type,
        status: history.status,
        amount: history.amount,
        bahtPerToken: history.bahtPerToken,
        bahtAmount: history.bahtAmount,
        before: history.before,
        after: history.after,
        ref: history.ref,
        note: history.note,
        createdAt: history.createdAt.toISOString(),
    };
}
