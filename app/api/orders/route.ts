import { CreateOrderInput } from "@/lib/api-types";
import { requireUser } from "@/server/auth/current-user";
import { withHandler } from "@/server/http/handler";
import { ApiError } from "@/server/http/errors";
import { success } from "@/server/http/response";
import { createOrder, getMyOrders } from "@/server/services/order.service";

export const GET = withHandler(async (req) => {
    const user = await requireUser(req);
    return success(await getMyOrders(user.id));
});

export const POST = withHandler(async (req) => {
    const user = await requireUser(req);
    const input = (await req.json().catch(() => null)) as CreateOrderInput | null;
    if (!input || typeof input !== "object") throw new ApiError("VALIDATION_ERROR", "ข้อมูลคำสั่งซื้อไม่ถูกต้อง", 422);
    return success(await createOrder(user.id, input), 201);
});
