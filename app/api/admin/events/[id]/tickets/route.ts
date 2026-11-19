import type { EventTicketInput } from "@/lib/api-types";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { privateSuccess as success } from "@/server/http/response";
import { createEventTicket, getEventTickets } from "@/server/services/ticket.service";

type Context = { params: Promise<{ id: string }> };

export const GET = withHandler(async (request, { params }: Context) => {
    const { id } = await params;
    await requirePermission(request, PERMISSIONS.EVENT_UPDATE, { eventId: id });
    return success(await getEventTickets(id));
});

export const POST = withHandler(async (request, { params }: Context) => {
    const { id } = await params;
    const actor = await requirePermission(request, PERMISSIONS.EVENT_UPDATE, { eventId: id });
    const input = await readJson<EventTicketInput>(request);
    return success(await createEventTicket(id, input, actor.id), 201);
});
