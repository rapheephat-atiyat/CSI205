import type { EventInput } from "@/lib/api-types";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { success } from "@/server/http/response";
import { deleteEvent, getEventById, updateEvent } from "@/server/services/event.service";

type Context = { params: Promise<{ id: string }> };

export const GET = withHandler(async (req, { params }: Context) => {
    const { id } = await params;
    await requirePermission(req, PERMISSIONS.EVENT_UPDATE, { eventId: id });
    return success(await getEventById(id));
});

export const DELETE = withHandler(async (req, { params }: Context) => {
    const { id } = await params;
    await requirePermission(req, PERMISSIONS.EVENT_CREATE);
    return success(await deleteEvent(id));
});

export const PATCH = withHandler(async (req, { params }: Context) => {
    const { id } = await params;
    await requirePermission(req, PERMISSIONS.EVENT_UPDATE, { eventId: id });
    const input = await readJson<Partial<EventInput>>(req);
    return success(await updateEvent(id, input));
});
