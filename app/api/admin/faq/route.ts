import { requireAdmin } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { getAdminFaq } from "@/server/services/faq.service";

export const GET = withHandler(async (request) => {
    await requireAdmin(request);
    const response = success(await getAdminFaq());
    response.headers.set("Cache-Control", "no-store");
    return response;
});
