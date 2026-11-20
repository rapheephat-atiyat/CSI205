import { PERMISSIONS } from "@/lib/permissions";
import { authorizeAdminEvent } from "@/server/auth/admin-event";
import { withHandler } from "@/server/http/handler";
import { privateSuccess } from "@/server/http/response";
import type { AdminStoreCreateInput } from "@/lib/api-types";
import { readJson } from "@/server/http/request";
import { listAdminStores } from "@/server/services/admin-event.service";
import { createStore } from "@/server/services/store.service";
type Context = { params: Promise<{ id: string }> };
export const GET = withHandler(async (req, { params }: Context) => {
    const { id } = await authorizeAdminEvent(req, params, PERMISSIONS.STORE_MANAGE);
    return privateSuccess(await listAdminStores(id));
});
export const POST = withHandler(async (req, { params }: Context) => {
    const { id, user } = await authorizeAdminEvent(req, params, PERMISSIONS.STORE_MANAGE);
    const { product, ...input } = await readJson<AdminStoreCreateInput>(req);
    return privateSuccess(await createStore({ ...input, eventId: id }, user.id, product), 201);
});

