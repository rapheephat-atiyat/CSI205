import type { EventInput } from "@/lib/api-types";
import { PERMISSIONS } from "@/lib/permissions";
import { requireUser } from "@/server/auth/current-user";
import { requirePermission } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { success } from "@/server/http/response";
import { createEvent, listManageableEvents } from "@/server/services/event.service";

export const GET = withHandler(async (req) => {
    const user = await requireUser(req);
    return success(await listManageableEvents(user));
});

export const POST = withHandler(async (req) => {
    await requirePermission(req, PERMISSIONS.EVENT_CREATE);
    const input = await readJson<EventInput>(req);
    return success(await createEvent(input), 201);
});
