import type { WalletTransactionInput } from "@/lib/api-types";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { success } from "@/server/http/response";
import { adjustUserWallet } from "@/server/services/wallet.service";
export const POST = withHandler(async (req) => {
    const staff = await requirePermission(req, PERMISSIONS.TOKEN_TOPUP);
    const body = await readJson<WalletTransactionInput>(req);
    return success(await adjustUserWallet(staff.id, "TOPUP", body));
});
