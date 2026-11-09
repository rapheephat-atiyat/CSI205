import "server-only";
import type { WalletDetail, WalletTransactionInput } from "@/lib/api-types";
import { getDatabase } from "@/server/database/database.souce";
import { Wallet, WalletHistory } from "@/server/database/entities";
import { TRANSACTION_STATUSES, TRANSACTION_TYPES } from "@/server/database/enums/domain.enum";
import { ApiError } from "@/server/http/errors";

export async function getUserWallet(userId: string): Promise<WalletDetail> {
    const db = await getDatabase();
    const repo = db.getRepository(Wallet);
    let wallet = await repo.findOne({
        where: { userId },
        relations: { walletHistories: true },
    });

    if (!wallet) {
        wallet = await repo.save(repo.create({ userId, total: "0.00" }));
        wallet.walletHistories = [];
    }

    return {
        id: wallet.id,
        userId: wallet.userId,
        storeId: wallet.storeId,
        total: wallet.total,
        histories: (wallet.walletHistories ?? [])
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map((h) => ({
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
            })),
        createdAt: wallet.createdAt.toISOString(),
        updatedAt: wallet.updatedAt.toISOString(),
    };
}

export async function adjustUserWallet(
    staffId: string,
    type: "TOPUP" | "REFUND",
    input: WalletTransactionInput
): Promise<WalletDetail> {
    const amount = Number(input.amount);
    if (Number.isNaN(amount) || amount <= 0) throw new ApiError("VALIDATION_ERROR", "จำนวนเงินต้องมากกว่า 0", 422);

    const db = await getDatabase();
    await db.transaction(async (manager) => {
        let wallet = await manager.findOne(Wallet, {
            where: { userId: input.userId },
            lock: { mode: "pessimistic_write" },
        });
        if (!wallet) {
            wallet = await manager.save(manager.create(Wallet, { userId: input.userId, total: "0.00" }));
        }

        const before = Number(wallet.total);
        if (type === "REFUND" && before < amount) {
            throw new ApiError("INSUFFICIENT_BALANCE", "ยอดเงินคงเหลือไม่พอสำหรับการคืนเงิน", 400);
        }

        const after = type === "TOPUP" ? before + amount : before - amount;
        wallet.total = after.toFixed(2);
        await manager.save(wallet);

        const history = manager.create(WalletHistory, {
            walletId: wallet.id,
            type: type === "TOPUP" ? TRANSACTION_TYPES.TOPUP : TRANSACTION_TYPES.REFUND,
            status: TRANSACTION_STATUSES.COMPLETED,
            amount: amount.toFixed(2),
            before: before.toFixed(2),
            after: after.toFixed(2),
            ref: staffId,
            note: input.note ?? (type === "TOPUP" ? "เติมเงินเข้ากระเป๋า" : "คืนเงิน"),
        });
        await manager.save(history);
    });

    return getUserWallet(input.userId);
}