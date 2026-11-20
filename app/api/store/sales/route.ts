import { PERMISSIONS } from "@/lib/permissions";
import { requireUser } from "@/server/auth/current-user";
import { checkPermission } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler";
import { privateSuccess } from "@/server/http/response";
import { getMyStore, getStoreSalesSummary } from "@/server/services/store.service";

export const GET = withHandler(async (req) => {
    const user = await requireUser(req);
    const storeId = new URL(req.url).searchParams.get("storeId") ?? undefined;
    const store = await getMyStore(user, storeId);
    checkPermission(user, PERMISSIONS.STORE_SELL, { storeId: store.id });
    return privateSuccess(await getStoreSalesSummary(store.id));
});
