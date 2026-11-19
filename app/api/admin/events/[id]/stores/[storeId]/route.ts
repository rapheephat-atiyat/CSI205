import { PERMISSIONS } from "@/lib/permissions";
import { authorizeAdminEvent } from "@/server/auth/admin-event";
import { withHandler } from "@/server/http/handler";
import { privateSuccess } from "@/server/http/response";
import type { StoreInput } from "@/lib/api-types";
import { readJson } from "@/server/http/request";
import { deleteAdminStore, updateAdminStore } from "@/server/services/admin-event.service";
type Context = { params: Promise<{ id: string; storeId: string }> };
export const PATCH = withHandler(async (req, { params }: Context) => {
    const { id, storeId, user } = await authorizeAdminEvent(req, params, PERMISSIONS.STORE_MANAGE);
    return privateSuccess(await updateAdminStore(id, storeId, user.id, await readJson<Partial<StoreInput>>(req)));
});
export const DELETE = withHandler(async (req, { params }: Context) => {
    const { id, storeId, user } = await authorizeAdminEvent(req, params, PERMISSIONS.STORE_MANAGE);
    return privateSuccess(await deleteAdminStore(id, storeId, user.id));
});

