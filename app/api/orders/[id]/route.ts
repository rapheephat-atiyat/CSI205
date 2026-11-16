import { requireUser } from "@/server/auth/current-user";
import { ApiError } from "@/server/http/errors";
import { withHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { success } from "@/server/http/response";
import { cancelMyOrder, getMyOrder, submitOrderPayment } from "@/server/services/order.service";

type Context = { params: Promise<{ id: string }> };

export const GET = withHandler(async (request, { params }: Context) => {
    const user = await requireUser(request);
    const { id } = await params;
    return success(await getMyOrder(user.id, id));
});

export const PATCH = withHandler(async (req, { params }: Context) => {
    const user = await requireUser(req);
    const { id } = await params;
    const body = await readJson<{ action?: string; proof?: unknown }>(req);
    switch (body.action) {
        case "submit":
            return success(await submitOrderPayment(user.id, id, body.proof));
        case "cancel":
            await cancelMyOrder(user.id, id);
            return success(null);
        default:
            throw new ApiError("VALIDATION_ERROR", "ไม่รู้จักคำสั่งนี้", 422);
    }
});
