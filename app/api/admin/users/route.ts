import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { listUsers } from "@/server/services/user-admin.service";

export const GET = withHandler(async (req) => {
    await requirePermission(req, PERMISSIONS.PERMISSION_MANAGE);
    return success(await listUsers());
});