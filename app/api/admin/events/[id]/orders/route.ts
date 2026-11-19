import { ApiError } from "@/server/http/errors";
import { PERMISSIONS } from "@/lib/permissions";
import { authorizeAdminEvent } from "@/server/auth/admin-event";
import { withHandler } from "@/server/http/handler";
import { privateSuccess } from "@/server/http/response";
import type { AdminOrderFilters } from "@/lib/api-types";
import { listAdminOrders } from "@/server/services/admin-order.service";
type Context = { params: Promise<{ id: string }> };
export const GET = withHandler(async (req, { params }: Context) => {
    const { id } = await authorizeAdminEvent(req, params, PERMISSIONS.ORDER_REVIEW);
    const query = new URL(req.url).searchParams;
    const filters = { status: query.get("status") || undefined, review: query.get("review") || undefined, query: query.get("query") ?? "", page: Number(query.get("page") ?? 1) };
    if (filters.review && filters.review !== "pending") throw new ApiError("VALIDATION_ERROR", "ตัวกรองไม่ถูกต้อง", 422);
    return privateSuccess(await listAdminOrders(id, filters as AdminOrderFilters));
});

