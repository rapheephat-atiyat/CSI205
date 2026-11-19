import { ApiError } from "@/server/http/errors";
import { PERMISSIONS } from "@/lib/permissions";
import { authorizeAdminEvent } from "@/server/auth/admin-event";
import { withHandler } from "@/server/http/handler";
import { privateSuccess } from "@/server/http/response";
import type { Permission } from "@/lib/permissions";
import { readJson } from "@/server/http/request";
import { changeEventRole } from "@/server/services/admin-event.service";
type Context = { params: Promise<{ id: string; userId: string; roleId: string }> };
export const PATCH = withHandler(async (req, { params }: Context) => {
    const { id, userId, roleId, user } = await authorizeAdminEvent(req, params, PERMISSIONS.PERMISSION_MANAGE);
    const input = await readJson<{ permissions: Permission[] }>(req);
    if (!Array.isArray(input.permissions)) throw new ApiError("VALIDATION_ERROR", "กรุณาระบุรายการสิทธิ์", 422);
    return privateSuccess(await changeEventRole(id, userId, roleId, user, input.permissions));
});
export const DELETE = withHandler(async (req, { params }: Context) => {
    const { id, userId, roleId, user } = await authorizeAdminEvent(req, params, PERMISSIONS.PERMISSION_MANAGE);
    return privateSuccess(await changeEventRole(id, userId, roleId, user));
});

