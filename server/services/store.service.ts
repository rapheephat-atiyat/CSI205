import "server-only";
import type { ProductInput, StoreDetail, StoreInput, StoreSellInput } from "@/lib/api-types";
import { getDatabase } from "@/server/database/database.souce";
import { Product, Store, User, Wallet, WalletHistory } from "@/server/database/entities";
import { TRANSACTION_STATUSES, TRANSACTION_TYPES } from "@/server/database/enums/domain.enum";
import { ApiError } from "@/server/http/errors";

function toStoreDetail(s: Store): StoreDetail {
    return {
        id: s.id,
        eventId: s.eventId,
        name: s.name,
        description: s.description,
        banner: s.banner,
        thumbnail: s.thumbnail,
        product: s.product
            ? {
                id: s.product.id,
                storeId: s.product.storeId,
                title: s.product.title,
                description: s.product.description,
                price: s.product.price,
                images: s.product.images,
                createdAt: s.product.createdAt.toISOString(),
                updatedAt: s.product.updatedAt.toISOString(),
            }
            : null,
        walletBalance: s.wallet?.total ?? "0.00",
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
    };
}

export async function createStore(input: StoreInput): Promise<StoreDetail> {
    const db = await getDatabase();
    const storeId = await db.transaction(async (manager) => {
        const store = manager.create(Store, {
            eventId: input.eventId,
            name: input.name.trim(),
            description: input.description ?? null,
            banner: input.banner ?? null,
            thumbnail: input.thumbnail ?? null,
        });
        const saved = await manager.save(store);

        const wallet = manager.create(Wallet, { storeId: saved.id, total: "0.00" });
        await manager.save(wallet);
        return saved.id;
    });

    const fullStore = await db.getRepository(Store).findOne({
        where: { id: storeId },
        relations: { product: true, wallet: true },
    });
    return toStoreDetail(fullStore!);
}

export async function getMyStore(user: User): Promise<StoreDetail> {
    const storeRole = user.userRoles.find((r) => r.storeId !== null);
    if (!storeRole?.storeId) throw new ApiError("STORE_NOT_FOUND", "คุณยังไม่ได้ผูกกับร้านค้าใด", 404);

    const db = await getDatabase();
    const store = await db.getRepository(Store).findOne({
        where: { id: storeRole.storeId },
        relations: { product: true, wallet: true },
    });
    if (!store) throw new ApiError("STORE_NOT_FOUND", "ไม่พบข้อมูลร้านค้า", 404);
    return toStoreDetail(store);
}

export async function upsertStoreProduct(storeId: string, input: ProductInput): Promise<StoreDetail> {
    const db = await getDatabase();
    const repo = db.getRepository(Product);
    let product = await repo.findOneBy({ storeId });

    if (!product) {
        product = repo.create({
            storeId,
            title: input.title.trim(),
            description: input.description,
            price: Number(input.price).toFixed(2),
            images: input.images ?? [],
        });
    } else {
        product.title = input.title.trim();
        product.description = input.description;
        product.price = Number(input.price).toFixed(2);
        if (input.images !== undefined) product.images = input.images;
    }
    await repo.save(product);

    const store = await db.getRepository(Store).findOne({
        where: { id: storeId },
        relations: { product: true, wallet: true },
    });
    return toStoreDetail(store!);
}

export async function sellToCustomer(storeId: string, input: StoreSellInput) {
    const amount = Number(input.amount);
    if (Number.isNaN(amount) || amount <= 0) throw new ApiError("VALIDATION_ERROR", "จำนวนเงินต้องมากกว่า 0", 422);

    const db = await getDatabase();
    return db.transaction(async (manager) => {
        const customerWallet = await manager.findOne(Wallet, {
            where: { userId: input.customerUserId },
            lock: { mode: "pessimistic_write" },
        });
        if (!customerWallet) throw new ApiError("WALLET_NOT_FOUND", "ไม่พบกระเป๋าเงินของลูกค้า", 404);

        const customerBefore = Number(customerWallet.total);
        if (customerBefore < amount) throw new ApiError("INSUFFICIENT_BALANCE", "ยอดเงินของลูกค้าไม่เพียงพอ", 400);

        let storeWallet = await manager.findOne(Wallet, {
            where: { storeId },
            lock: { mode: "pessimistic_write" },
        });
        if (!storeWallet) {
            storeWallet = await manager.save(manager.create(Wallet, { storeId, total: "0.00" }));
        }

        const storeBefore = Number(storeWallet.total);
        customerWallet.total = (customerBefore - amount).toFixed(2);
        storeWallet.total = (storeBefore + amount).toFixed(2);

        await manager.save([customerWallet, storeWallet]);

        const histories = [
            manager.create(WalletHistory, {
                walletId: customerWallet.id,
                type: TRANSACTION_TYPES.PURCHASE,
                status: TRANSACTION_STATUSES.COMPLETED,
                amount: amount.toFixed(2),
                before: customerBefore.toFixed(2),
                after: customerWallet.total,
                ref: storeId,
                note: input.note ?? "ซื้อสินค้าในงาน",
            }),
            manager.create(WalletHistory, {
                walletId: storeWallet.id,
                type: TRANSACTION_TYPES.PURCHASE,
                status: TRANSACTION_STATUSES.COMPLETED,
                amount: amount.toFixed(2),
                before: storeBefore.toFixed(2),
                after: storeWallet.total,
                ref: input.customerUserId,
                note: input.note ?? "รับชำระค่าสินค้า",
            }),
        ];
        await manager.save(histories);

        return { storeBalance: storeWallet.total, customerBalance: customerWallet.total };
    });
}