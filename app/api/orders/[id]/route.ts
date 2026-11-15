import { requireUser } from "@/server/auth/current-user";
import { ApiError } from "@/server/http/errors";
import { withHandler } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { cancelMyOrder, submitOrderPayment } from "@/server/services/order.service";

type Context = { params: Promise<{ id: string }> };

export const PATCH = withHandler(async (req, { params }: Context) => {
    const user = await requireUser(req);
    const { id } = await params;
    const body = await req.json().catch(() => null) as { action?: string; proof?: unknown } | null;
    switch (body?.action) {
        case "submit":
            return success(await submitOrderPayment(user.id, id, body.proof));
        case "cancel":
            await cancelMyOrder(user.id, id);
            return success(null);
        default:
            throw new ApiError("VALIDATION_ERROR", "ไม่รู้จักคำสั่งนี้", 422);
    }
});
