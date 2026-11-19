import type { ProductInput, StoreInput } from "@/lib/api-types";
import { PERMISSIONS } from "@/lib/permissions";
import { requireUser } from "@/server/auth/current-user";
import { checkPermission, requirePermission } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { success } from "@/server/http/response";
import { createStore, getMyStore, upsertStoreProduct } from "@/server/services/store.service";

export const GET = withHandler(async (req) => {
    const user = await requireUser(req);
    const storeId = new URL(req.url).searchParams.get("storeId") ?? undefined;
    return success(await getMyStore(user, storeId));
});

export const POST = withHandler(async (req) => {
    const input = await readJson<StoreInput>(req);
    await requirePermission(req, PERMISSIONS.EVENT_UPDATE, { eventId: input.eventId });
    return success(await createStore(input), 201);
});

export const PATCH = withHandler(async (req) => {
    const user = await requireUser(req);
    const storeId = new URL(req.url).searchParams.get("storeId") ?? undefined;
    const store = await getMyStore(user, storeId);
    checkPermission(user, PERMISSIONS.STORE_MANAGE, { storeId: store.id });
    const body = await readJson<ProductInput>(req);
    return success(await upsertStoreProduct(store.id, body));
});
