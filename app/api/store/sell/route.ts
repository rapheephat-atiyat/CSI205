import { StoreSellInput } from "@/lib/api-types";
import { PERMISSIONS } from "@/lib/permissions";
import { requireUser } from "@/server/auth/current-user";
import { requirePermission } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { getMyStore, sellToCustomer } from "@/server/services/store.service";

export const POST = withHandler(async (req) => {
    const user = await requireUser(req);
    const store = await getMyStore(user);
    await requirePermission(req, PERMISSIONS.STORE_SELL, { storeId: store.id });
    const body = (await req.json()) as StoreSellInput;
    return success(await sellToCustomer(store.id, body));
});
