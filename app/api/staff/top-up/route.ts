import { requireUser } from "@/server/auth/current-user";
import { withHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { success } from "@/server/http/response";
import { topUpStaffAttendee } from "@/server/services/staff.service";

export const POST = withHandler(async (req) => {
    const staff = await requireUser(req);
    const body = await readJson<{ attendeeId: string; amount: number; note?: string }>(req);
    return success(await topUpStaffAttendee(staff, body));
});
