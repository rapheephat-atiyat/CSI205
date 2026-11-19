import { PERMISSIONS } from "@/lib/permissions";
import { authorizeAdminEvent } from "@/server/auth/admin-event";
import { withHandler } from "@/server/http/handler";
import { privateSuccess } from "@/server/http/response";
import type { AssignUserRoleInput } from "@/lib/api-types";
import { readJson } from "@/server/http/request";
import { assignEventRole } from "@/server/services/admin-event.service";
type Context = { params: Promise<{ id: string; userId: string }> };
export const POST = withHandler(async (req, { params }: Context) => {
    const { id, userId, user } = await authorizeAdminEvent(req, params, PERMISSIONS.PERMISSION_MANAGE);
    return privateSuccess(await assignEventRole(id, userId, user, await readJson<AssignUserRoleInput>(req)), 201);
});

