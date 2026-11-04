import { UserInput } from "@/lib/api-types";
import { requireUser } from "@/server/auth/current-user";
import { withHandler } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { getMe, updateMe } from "@/server/services/auth.service";

export const GET = withHandler(async (req) => {
    const user = await requireUser(req);
    return success(await getMe(user.id));
});

export const PATCH = withHandler(async (req) => {
    const user = await requireUser(req);
    const input = (await req.json()) as UserInput;
    return success(await updateMe(user.id, input));
});
