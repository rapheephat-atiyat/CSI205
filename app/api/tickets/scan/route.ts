import { ScanTicketInput } from "@/lib/api-types";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { scanTicket } from "@/server/services/order.service";

export const POST = withHandler(async (req) => {
    const staff = await requirePermission(req, PERMISSIONS.TICKET_SCAN);
    const { qrToken } = (await req.json()) as ScanTicketInput;
    return success(await scanTicket(staff.id, qrToken));
});