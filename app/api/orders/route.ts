import { CreateOrderInput } from "@/lib/api-types";
import { requireUser } from "@/server/auth/current-user";
import { withHandler } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { createOrder, getMyOrders } from "@/server/services/order.service";

export const GET = withHandler(async (req) => {
    const user = await requireUser(req);
    return success(await getMyOrders(user.id));
});

export const POST = withHandler(async (req) => {
    const user = await requireUser(req);
    const input = (await req.json()) as CreateOrderInput;
    return success(await createOrder(user.id, input), 201);
});