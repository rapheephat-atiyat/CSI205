import { EventInput } from "@/lib/api-types";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler"
import { success } from "@/server/http/response";
import { dropEvnet, getEventById, updateEvent } from "@/server/services/event.service";

export const GET = withHandler(async (req, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    await requirePermission(req, PERMISSIONS.EVENT_UPDATE, { eventId: id });
    return success(await getEventById(id))
});

export const DELETE = withHandler(async (req, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    await requirePermission(req, PERMISSIONS.EVENT_CREATE);
    return success(await dropEvnet(id))
})

export const PATCH = withHandler(async (req, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    await requirePermission(req, PERMISSIONS.EVENT_UPDATE, { eventId: id });
    const input = await req.json() as Partial<EventInput>;
    const event = await updateEvent(id, input);
    return success(event)
})