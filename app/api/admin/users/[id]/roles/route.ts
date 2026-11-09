import { AssignUserRoleInput } from "@/lib/api-types";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { assignRoleToUser } from "@/server/services/user-admin.service";

export const POST = withHandler(async (req, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    await requirePermission(req, PERMISSIONS.PERMISSION_MANAGE);
    const body = (await req.json()) as AssignUserRoleInput;
    return success(await assignRoleToUser(id, body), 201);
});