import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/auth/permission";
import { invalidatePublicEvents } from "@/server/cache/tags";
import { withHandler } from "@/server/http/handler";
import { privateSuccess as success } from "@/server/http/response";
import { setEventArchived } from "@/server/services/event.service";

type Context = { params: Promise<{ id: string }> };

export const POST = withHandler(async (request, { params }: Context) => {
    const actor = await requirePermission(request, PERMISSIONS.EVENT_CREATE);
    const { id } = await params;
    const result = await setEventArchived(id, false, actor.id);
    invalidatePublicEvents();
    return success(result);
});
