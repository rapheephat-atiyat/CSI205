import type { ScanTicketInput } from "@/lib/api-types";
import { requireUser } from "@/server/auth/current-user";
import { withHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { success } from "@/server/http/response";
import { scanTicket } from "@/server/services/ticket.service";

export const POST = withHandler(async (req) => {
    const staff = await requireUser(req);
    const { qrToken, action } = await readJson<ScanTicketInput>(req);
    return success(await scanTicket(staff, qrToken, action));
});
