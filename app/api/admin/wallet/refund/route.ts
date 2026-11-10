import { WalletTransactionInput } from "@/lib/api-types";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { adjustUserWallet } from "@/server/services/wallet.service";

export const POST = withHandler(async (req) => {
    const staff = await requirePermission(req, PERMISSIONS.TOKEN_REFUND_APPROVE);
    const body = (await req.json()) as WalletTransactionInput;
    return success(await adjustUserWallet(staff.id, "REFUND", body));
});