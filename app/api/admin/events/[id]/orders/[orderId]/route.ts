import { PERMISSIONS } from "@/lib/permissions";
import { authorizeAdminEvent } from "@/server/auth/admin-event";
import { withHandler } from "@/server/http/handler";
import { privateSuccess } from "@/server/http/response";
import { getAdminOrder } from "@/server/services/admin-order.service";
type Context = { params: Promise<{ id: string; orderId: string }> };
export const GET = withHandler(async (req, { params }: Context) => {
    const { id, orderId } = await authorizeAdminEvent(req, params, PERMISSIONS.ORDER_REVIEW);
    return privateSuccess(await getAdminOrder(id, orderId));
});

