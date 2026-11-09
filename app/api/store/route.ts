import { PERMISSIONS } from "@/lib/permissions";
import { requireUser } from "@/server/auth/current-user";
import { requirePermission } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { getMyStore, upsertStoreProduct } from "@/server/services/store.service";

export const GET = withHandler(async (req) => {
    const user = await requireUser(req);
    return success(await getMyStore(user));
});

export const PATCH = withHandler(async (req) => {
    const user = await requireUser(req);
    const store = await getMyStore(user);
    await requirePermission(req, PERMISSIONS.STORE_MANAGE, { storeId: store.id });
    const body = await req.json();
    return success(await upsertStoreProduct(store.id, body));
});
