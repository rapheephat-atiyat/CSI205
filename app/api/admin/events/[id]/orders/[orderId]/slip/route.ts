import { PERMISSIONS } from "@/lib/permissions";
import { authorizeAdminEvent } from "@/server/auth/admin-event";
import { withHandler } from "@/server/http/handler";
import { getAdminPaymentSlip } from "@/server/services/admin-order.service";
type Context = { params: Promise<{ id: string; orderId: string }> };
export const GET = withHandler(async (req, { params }: Context) => {
    const { id, orderId } = await authorizeAdminEvent(req, params, PERMISSIONS.ORDER_REVIEW);
    const { type, file } = await getAdminPaymentSlip(id, orderId);
    return new Response(new Uint8Array(file), { headers: { "Content-Type": type, "Content-Length": String(file.length), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Disposition": 'inline; filename="payment-slip"' } });
});

