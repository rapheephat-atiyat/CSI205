import { withHandler } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { getPublicEvents } from "@/server/cache/public-content";

export const GET = withHandler(async () => {
    return success(await getPublicEvents());
});
