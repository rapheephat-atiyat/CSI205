import { requireUser } from "@/server/auth/current-user";
import { withHandler } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { getStaffAttendees } from "@/server/services/staff.service";

export const GET = withHandler(async (req) => {
    const staff = await requireUser(req);
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    return success(await getStaffAttendees(staff, q, status));
});
