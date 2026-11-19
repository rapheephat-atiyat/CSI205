import "server-only";
import type { ProductInput, StoreDetail, StoreInput, StoreSaleResult, StoreSellInput } from "@/lib/api-types";
import { getDatabase } from "@/server/database/database.souce";
import { Events, Product, Store, Wallet, WalletHistory, type User } from "@/server/database/entities";
import { TRANSACTION_STATUSES, TRANSACTION_TYPES } from "@/server/database/enums/domain.enum";
import { ApiError } from "@/server/http/errors";
import { readMoney } from "./money";
import { recordAdminActivity } from "./admin-activity";
import { readUuid } from "@/server/http/validation";

export function toStoreDetail(s: Store): StoreDetail {
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

export async function createStore(input: StoreInput, actorId?: string): Promise<StoreDetail> {
    readUuid(input.eventId, "รหัสงาน");
    if (input.description != null && (typeof input.description !== "string" || input.description.length > 5000)) throw new ApiError("VALIDATION_ERROR", "รายละเอียดร้านค้าไม่ถูกต้อง", 422);
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (!name || name.length > 255 || typeof input.eventId !== "string" || !input.eventId) {
        throw new ApiError("VALIDATION_ERROR", "กรุณาระบุชื่องานและชื่อร้านค้า", 422);
    }
    const db = await getDatabase();
    return db.transaction(async (manager) => {
        if (!await manager.existsBy(Events, { id: input.eventId })) {
            throw new ApiError("EVENT_NOT_FOUND", "ไม่พบงานที่ต้องการเปิดร้าน", 404);
        }
        const store = manager.create(Store, {
            eventId: input.eventId,
            name,
            description: input.description ?? null,
            banner: input.banner ?? null,
            thumbnail: input.thumbnail ?? null,
        });
        const savedStore = await manager.save(store);
        savedStore.wallet = await manager.save(Wallet, { storeId: savedStore.id, total: "0.00" });
        await recordAdminActivity(manager, actorId, input.eventId, "store.create", savedStore.id);
        return toStoreDetail(savedStore);
    });
}

export async function getMyStore(user: User, storeId?: string): Promise<StoreDetail> {
    const storeRole = user.userRoles.find((role) => role.storeId && (!storeId || role.storeId === storeId));
    if (!storeRole?.storeId) throw new ApiError("STORE_NOT_FOUND", "คุณยังไม่ได้ผูกกับร้านค้าใด", 404);
    return getStoreDetail(storeRole.storeId);
}

async function getStoreDetail(storeId: string): Promise<StoreDetail> {
    const db = await getDatabase();
    const store = await db.getRepository(Store).findOne({
        where: { id: storeId },
        relations: { product: true, wallet: true },
    });
    if (!store) throw new ApiError("STORE_NOT_FOUND", "ไม่พบข้อมูลร้านค้า", 404);
    return toStoreDetail(store);
}

export async function upsertStoreProduct(storeId: string, input: ProductInput): Promise<StoreDetail> {
    const title = typeof input.title === "string" ? input.title.trim() : "";
    if (!title || title.length > 255 || typeof input.description !== "string") {
        throw new ApiError("VALIDATION_ERROR", "กรุณาระบุชื่อและรายละเอียดสินค้า", 422);
    }
    const price = readMoney(input.price, true).toFixed(2);

    const db = await getDatabase();
    await db.transaction(async (manager) => {
        const store = await manager.findOne(Store, {
            where: { id: storeId },
            lock: { mode: "pessimistic_write" },
        });
        if (!store) throw new ApiError("STORE_NOT_FOUND", "ไม่พบข้อมูลร้านค้า", 404);

        const product = await manager.findOneBy(Product, { storeId });
        await manager.save(Product, {
            id: product?.id,
            storeId,
            title,
            description: input.description,
            price,
            images: input.images ?? product?.images ?? [],
        });
    });
    return getStoreDetail(storeId);
}

export async function sellToCustomer(storeId: string, input: StoreSellInput): Promise<StoreSaleResult> {
    const amount = readMoney(input.amount);
    if (typeof input.customerUserId !== "string" || !input.customerUserId) {
        throw new ApiError("VALIDATION_ERROR", "กรุณาระบุรหัสผู้ซื้อ", 422);
    }

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
            await manager.createQueryBuilder().insert().into(Wallet).values({ storeId }).orIgnore().execute();
            storeWallet = await manager.findOneOrFail(Wallet, {
                where: { storeId },
                lock: { mode: "pessimistic_write" },
            });
        }

        const storeBefore = Number(storeWallet.total);
        customerWallet.total = (customerBefore - amount).toFixed(2);
        storeWallet.total = (storeBefore + amount).toFixed(2);

        await manager.save([customerWallet, storeWallet]);

        await manager.insert(WalletHistory, [
            {
                walletId: customerWallet.id,
                type: TRANSACTION_TYPES.PURCHASE,
                status: TRANSACTION_STATUSES.COMPLETED,
                amount: amount.toFixed(2),
                before: customerBefore.toFixed(2),
                after: customerWallet.total,
                ref: storeId,
                note: input.note ?? "ซื้อสินค้าในงาน",
            },
            {
                walletId: storeWallet.id,
                type: TRANSACTION_TYPES.PURCHASE,
                status: TRANSACTION_STATUSES.COMPLETED,
                amount: amount.toFixed(2),
                before: storeBefore.toFixed(2),
                after: storeWallet.total,
                ref: input.customerUserId,
                note: input.note ?? "รับชำระค่าสินค้า",
            },
        ]);

        return { storeBalance: storeWallet.total, customerBalance: customerWallet.total };
    });
}
