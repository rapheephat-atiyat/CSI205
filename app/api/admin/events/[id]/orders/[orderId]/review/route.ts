import { PERMISSIONS } from "@/lib/permissions";
import { authorizeAdminEvent } from "@/server/auth/admin-event";
import { withHandler } from "@/server/http/handler";
import { privateSuccess } from "@/server/http/response";
import type { OrderReviewInput } from "@/lib/api-types";
import { readJson } from "@/server/http/request";
import { reviewAdminOrder } from "@/server/services/admin-order.service";
type Context = { params: Promise<{ id: string; orderId: string }> };
export const POST = withHandler(async (req, { params }: Context) => {
    const { id, orderId, user } = await authorizeAdminEvent(req, params, PERMISSIONS.ORDER_REVIEW);
    return privateSuccess(await reviewAdminOrder(id, orderId, user.id, await readJson<OrderReviewInput>(req)));
});

