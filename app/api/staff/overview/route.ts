import { requireUser } from "@/server/auth/current-user";
import { withHandler } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { getStaffOverview } from "@/server/services/staff.service";

export const GET = withHandler(async (req) => {
    const staff = await requireUser(req);
    return success(await getStaffOverview(staff));
});
