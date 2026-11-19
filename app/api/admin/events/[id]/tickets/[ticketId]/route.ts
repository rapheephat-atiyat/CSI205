import type { EventTicketInput } from "@/lib/api-types";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { success } from "@/server/http/response";
import { deleteEventTicket, getEventTicket, updateEventTicket } from "@/server/services/ticket.service";

type Context = { params: Promise<{ id: string; ticketId: string }> };

export const GET = withHandler(async (request, { params }: Context) => {
    const { id, ticketId } = await params;
    await requirePermission(request, PERMISSIONS.EVENT_UPDATE, { eventId: id });
    return success(await getEventTicket(id, ticketId));
});

export const PATCH = withHandler(async (request, { params }: Context) => {
    const { id, ticketId } = await params;
    await requirePermission(request, PERMISSIONS.EVENT_UPDATE, { eventId: id });
    const input = await readJson<Partial<EventTicketInput>>(request);
    return success(await updateEventTicket(id, ticketId, input));
});

export const DELETE = withHandler(async (request, { params }: Context) => {
    const { id, ticketId } = await params;
    await requirePermission(request, PERMISSIONS.EVENT_UPDATE, { eventId: id });
    return success(await deleteEventTicket(id, ticketId));
});
