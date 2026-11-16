import "server-only";
import type { WalletDetail, WalletHistoryItem, WalletTransactionInput } from "@/lib/api-types";
import { getDatabase } from "@/server/database/database.souce";
import { User, Wallet, WalletHistory } from "@/server/database/entities";
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
        let wallet = await manager.findOne(Wallet, {
            where: { userId: input.userId },
            lock: { mode: "pessimistic_write" },
        });
        if (!wallet) {
            await createMissingWallet(manager, input.userId);
            wallet = await manager.findOneOrFail(Wallet, {
                where: { userId: input.userId },
                lock: { mode: "pessimistic_write" },
            });
        }

        const before = Number(wallet.total);
        if (type === "REFUND" && before < amount) {
            throw new ApiError("INSUFFICIENT_BALANCE", "ยอดเงินคงเหลือไม่พอสำหรับการคืนเงิน", 400);
        }

        const after = type === "TOPUP" ? before + amount : before - amount;
        wallet.total = after.toFixed(2);
        await manager.save(wallet);

        await manager.insert(WalletHistory, {
            walletId: wallet.id,
            type: type === "TOPUP" ? TRANSACTION_TYPES.TOPUP : TRANSACTION_TYPES.REFUND,
            status: TRANSACTION_STATUSES.COMPLETED,
            amount: amount.toFixed(2),
            before: before.toFixed(2),
            after: after.toFixed(2),
            ref: staffId,
            note: input.note ?? (type === "TOPUP" ? "เติมเงินเข้ากระเป๋า" : "คืนเงิน"),
        });
    });

    return getUserWallet(input.userId);
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
        before: history.before,
        after: history.after,
        ref: history.ref,
        note: history.note,
        createdAt: history.createdAt.toISOString(),
    };
}
