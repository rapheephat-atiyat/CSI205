import type { EventSouvenirInput } from "@/lib/api-types";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { success } from "@/server/http/response";
import { deleteSouvenir, getSouvenir, updateSouvenir } from "@/server/services/event-souvenirs";

type Context = { params: Promise<{ id: string; souvenirId: string }> };

export const GET = withHandler(async (request, { params }: Context) => {
    const { id, souvenirId } = await params;
    await requirePermission(request, PERMISSIONS.EVENT_UPDATE, { eventId: id });
    return success(await getSouvenir(id, souvenirId));
});

export const PATCH = withHandler(async (request, { params }: Context) => {
    const { id, souvenirId } = await params;
    await requirePermission(request, PERMISSIONS.EVENT_UPDATE, { eventId: id });
    const input = await readJson<Partial<EventSouvenirInput>>(request);
    return success(await updateSouvenir(id, souvenirId, input));
});

export const DELETE = withHandler(async (request, { params }: Context) => {
    const { id, souvenirId } = await params;
    await requirePermission(request, PERMISSIONS.EVENT_UPDATE, { eventId: id });
    return success(await deleteSouvenir(id, souvenirId));
});
