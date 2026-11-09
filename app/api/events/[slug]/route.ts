import { withHandler } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { getEventBySlug } from "@/server/services/event.service";

export const GET = withHandler(async (req, { params }: { params: Promise<{ slug: string }> }) => {
    const { slug } = await params;
    return success(await getEventBySlug(slug))
})