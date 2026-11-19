import { PERMISSIONS } from "@/lib/permissions";
import { authorizeAdminEvent } from "@/server/auth/admin-event";
import { withHandler } from "@/server/http/handler";
import { privateSuccess } from "@/server/http/response";
import { getEventOverview } from "@/server/services/admin-event.service";
type Context = { params: Promise<{ id: string }> };
export const GET = withHandler(async (req, { params }: Context) => {
    const { id } = await authorizeAdminEvent(req, params, PERMISSIONS.REPORT_READ);
    return privateSuccess(await getEventOverview(id));
});

