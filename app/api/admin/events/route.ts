import { EventInput } from "@/lib/api-types";
import { PERMISSIONS } from "@/lib/permissions";
import { requireUser } from "@/server/auth/current-user"
import { requirePermission } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler"
import { success } from "@/server/http/response";
import { createEvent, listManagableEvents } from "@/server/services/event.service";

export const GET = withHandler(async (req) => {
    const user = await requireUser(req);
    return success(await listManagableEvents(user))
});

export const POST = withHandler(async (req, res) => {
    await requirePermission(req, PERMISSIONS.EVENT_CREATE);
    const input = await req.json() as EventInput;
    return success(await createEvent(input), 201)
});