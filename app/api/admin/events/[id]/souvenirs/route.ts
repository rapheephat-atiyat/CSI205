import type { EventSouvenirInput } from "@/lib/api-types";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/auth/permission";
import { getDatabase } from "@/server/database/database.souce";
import { withHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { success } from "@/server/http/response";
import { createSouvenir, getEventSouvenirs } from "@/server/services/event-souvenirs";

type Context = { params: Promise<{ id: string }> };

export const GET = withHandler(async (request, { params }: Context) => {
    const { id } = await params;
    await requirePermission(request, PERMISSIONS.EVENT_UPDATE, { eventId: id });
    const db = await getDatabase();
    return success(await getEventSouvenirs(db.manager, id));
});

export const POST = withHandler(async (request, { params }: Context) => {
    const { id } = await params;
    await requirePermission(request, PERMISSIONS.EVENT_UPDATE, { eventId: id });
    const input = await readJson<EventSouvenirInput>(request);
    return success(await createSouvenir(id, input), 201);
});
