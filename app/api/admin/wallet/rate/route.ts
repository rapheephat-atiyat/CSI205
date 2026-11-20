import type { TokenRate } from "@/lib/api-types";
import { requireAdmin } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { success } from "@/server/http/response";
import { updateTokenRate } from "@/server/services/token-pricing.service";

export const PATCH = withHandler(async (request) => {
    const admin = await requireAdmin(request);
    const body = await readJson<TokenRate>(request);
    return success(await updateTokenRate(admin.id, body.bahtPerToken));
});
