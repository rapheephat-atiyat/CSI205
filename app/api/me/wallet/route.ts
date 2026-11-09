import { requireUser } from "@/server/auth/current-user";
import { withHandler } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { getUserWallet } from "@/server/services/wallet.service";

export const GET = withHandler(async (req) => {
    const user = await requireUser(req);
    return success(await getUserWallet(user.id));
});