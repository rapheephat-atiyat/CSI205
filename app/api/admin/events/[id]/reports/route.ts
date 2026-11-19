import { PERMISSIONS } from "@/lib/permissions";
import { authorizeAdminEvent } from "@/server/auth/admin-event";
import { withHandler } from "@/server/http/handler";
import { privateSuccess } from "@/server/http/response";
import { getAdminTicketReport, getEventOverview, listAdminStores } from "@/server/services/admin-event.service";
import { getAuditLogs } from "@/server/services/report.service";
type Context = { params: Promise<{ id: string }> };
export const GET = withHandler(async (req, { params }: Context) => {
    const { id } = await authorizeAdminEvent(req, params, PERMISSIONS.REPORT_EXPORT);
    const [overview, tickets, stores, auditLog] = await Promise.all([getEventOverview(id), getAdminTicketReport(id), listAdminStores(id), getAuditLogs(id)]);
    return privateSuccess({ overview, tickets, stores, auditLog });
});

