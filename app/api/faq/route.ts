import { connection } from "next/server";
import { withHandler } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { getPublicFaq } from "@/server/cache/public-content";

export const GET = withHandler(async () => {
    await connection();
    const response = success(await getPublicFaq());
    response.headers.set("Cache-Control", "no-store");
    return response;
});
