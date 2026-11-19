import { connection } from "next/server";
import { withHandler } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { getPublishedFaq } from "@/server/services/faq.service";

export const GET = withHandler(async () => {
    await connection();
    const response = success(await getPublishedFaq());
    response.headers.set("Cache-Control", "no-store");
    return response;
});
