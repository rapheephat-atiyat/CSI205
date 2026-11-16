import type { StoreSellInput } from "@/lib/api-types";
import { PERMISSIONS } from "@/lib/permissions";
import { requireUser } from "@/server/auth/current-user";
import { checkPermission } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { success } from "@/server/http/response";
import { getMyStore, sellToCustomer } from "@/server/services/store.service";

export const POST = withHandler(async (req) => {
    const user = await requireUser(req);
    const storeId = new URL(req.url).searchParams.get("storeId") ?? undefined;
    const store = await getMyStore(user, storeId);
    checkPermission(user, PERMISSIONS.STORE_SELL, { storeId: store.id });
    const body = await readJson<StoreSellInput>(req);
    return success(await sellToCustomer(store.id, body));
});
