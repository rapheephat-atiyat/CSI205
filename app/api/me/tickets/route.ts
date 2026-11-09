import { requireUser } from "@/server/auth/current-user";
import { withHandler } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { getMyTickets } from "@/server/services/order.service";

export const GET = withHandler(async (req) => {
    const user = await requireUser(req);
    return success(await getMyTickets(user.id));
});