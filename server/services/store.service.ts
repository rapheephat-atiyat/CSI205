import "server-only";
import type { ProductInput, StoreDetail, StoreInput, StoreSaleResult, StoreSalesSummary, StoreSellInput } from "@/lib/api-types";
import { getDatabase } from "@/server/database/database.souce";
import { Events, Product, Store, User, Wallet, WalletHistory } from "@/server/database/entities";
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

export async function createStore(
    input: StoreInput,
    actorId?: string,
    productInput?: Pick<ProductInput, "title" | "price" | "images">,
): Promise<StoreDetail> {
    readUuid(input.eventId, "รหัสงาน");
    if (input.description != null && (typeof input.description !== "string" || input.description.length > 5000)) throw new ApiError("VALIDATION_ERROR", "รายละเอียดร้านค้าไม่ถูกต้อง", 422);
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (!name || name.length > 255 || typeof input.eventId !== "string" || !input.eventId) {
        throw new ApiError("VALIDATION_ERROR", "กรุณาระบุชื่องานและชื่อร้านค้า", 422);
    }
    let product: { title: string; price: string; images: string[] } | undefined;
    if (productInput !== undefined) {
        if (!productInput || typeof productInput !== "object") {
            throw new ApiError("VALIDATION_ERROR", "ข้อมูลอาหารไม่ถูกต้อง", 422);
        }
        const title = typeof productInput.title === "string" ? productInput.title.trim() : "";
        if (!title || title.length > 255) {
            throw new ApiError("VALIDATION_ERROR", "กรุณาระบุชื่ออาหารให้ถูกต้อง", 422);
        }
        const images = productInput.images ?? [];
        if (
            !Array.isArray(images) ||
            images.length > 1 ||
            images.some((image) =>
                typeof image !== "string" ||
                image.length > 2_800_000 ||
                !/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(image)
            )
        ) {
            throw new ApiError("VALIDATION_ERROR", "รูปอาหารไม่ถูกต้อง (รองรับ PNG หรือ JPEG ไม่เกิน 2 MB)", 422);
        }
        product = { title, price: readMoney(productInput.price, true).toFixed(2), images };
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
        if (product) {
            savedStore.product = await manager.save(Product, {
                storeId: savedStore.id,
                title: product.title,
                description: "",
                price: product.price,
                images: product.images,
            });
        }
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

export async function getStoreSalesSummary(storeId: string): Promise<StoreSalesSummary> {
    readUuid(storeId, "รหัสร้านค้า");

    const now = new Date();
    const dateParts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(now);
    const datePart = (type: string) => Number(dateParts.find((part) => part.type === type)?.value);
    const year = datePart("year");
    const month = datePart("month");
    const day = datePart("day");
    const today = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const startAt = new Date(Date.UTC(year, month - 1, day - 6, -7));
    const endAt = new Date(Date.UTC(year, month - 1, day + 1, -7));
    const dates = Array.from({ length: 7 }, (_, index) => new Date(Date.UTC(year, month - 1, day - 6 + index)));
    const dateKey = (date: Date) =>
        `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    const labelFormat = new Intl.DateTimeFormat("th-TH", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
    });

    const db = await getDatabase();
    const historyRepository = db.getRepository(WalletHistory);
    const salesQuery = () =>
        historyRepository.createQueryBuilder("history")
            .innerJoin("history.wallet", "wallet")
            .where("wallet.storeId = :storeId", { storeId })
            .andWhere("history.type = :type", { type: TRANSACTION_TYPES.PURCHASE })
            .andWhere("history.status = :status", { status: TRANSACTION_STATUSES.COMPLETED });

    const [dailyRows, recentRows] = await Promise.all([
        salesQuery()
            .select(`to_char(history.createdAt AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD')`, "date")
            .addSelect("COALESCE(SUM(history.amount), 0)", "sales")
            .addSelect("COUNT(history.id)", "transactions")
            .andWhere("history.createdAt >= :startAt AND history.createdAt < :endAt", { startAt, endAt })
            .groupBy("1")
            .orderBy("1", "ASC")
            .getRawMany<{ date: string; sales: string; transactions: string }>(),
        salesQuery()
            .leftJoin(User, "customer", "customer.id = history.ref")
            .select("history.id", "id")
            .addSelect("customer.name", "customerName")
            .addSelect("history.amount", "amount")
            .addSelect("history.createdAt", "createdAt")
            .orderBy("history.createdAt", "DESC")
            .limit(10)
            .getRawMany<{
                id: string;
                customerName: string | null;
                amount: string;
                createdAt: Date | string;
            }>(),
    ]);

    const dailyByDate = new Map(dailyRows.map((row) => [row.date, row]));
    const dailySales = dates.map((date) => {
        const key = dateKey(date);
        const row = dailyByDate.get(key);
        return {
            date: key,
            label: labelFormat.format(date),
            sales: Number(row?.sales ?? 0),
        };
    });
    const todayRow = dailyByDate.get(today);

    return {
        todaySales: Number(todayRow?.sales ?? 0),
        todayTransactions: Number(todayRow?.transactions ?? 0),
        weeklySales: dailySales.reduce((sum, entry) => sum + entry.sales, 0),
        dailySales,
        recentTransactions: recentRows.map((row) => ({
            id: row.id,
            customerName: row.customerName,
            amount: Number(row.amount),
            createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString(),
        })),
    };
}
