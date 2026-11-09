import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { getOverviewReport } from "@/server/services/report.service";

export const GET = withHandler(async (req) => {
    await requirePermission(req, PERMISSIONS.REPORT_READ);
    return success(await getOverviewReport());
});