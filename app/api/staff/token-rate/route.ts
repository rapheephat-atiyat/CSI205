import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler";
import { privateSuccess } from "@/server/http/response";
import { getTokenRate } from "@/server/services/token-pricing.service";

export const GET = withHandler(async (request) => {
    await requirePermission(request, PERMISSIONS.TOKEN_TOPUP);
    return privateSuccess(await getTokenRate());
});
