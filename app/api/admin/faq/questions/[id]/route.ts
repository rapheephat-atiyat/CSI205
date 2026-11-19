import type { UpdateFaqQuestionInput } from "@/lib/api-types";
import { requireAdmin } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { success } from "@/server/http/response";
import { deleteFaqQuestion, getFaqQuestion, updateFaqQuestion } from "@/server/services/faq.service";
import { invalidatePublicFaq } from "@/server/cache/tags";

type Context = { params: Promise<{ id: string }> };

export const GET = withHandler(async (request, { params }: Context) => {
    await requireAdmin(request);
    const { id } = await params;
    const response = success(await getFaqQuestion(id));
    response.headers.set("Cache-Control", "no-store");
    return response;
});

export const PATCH = withHandler(async (request, { params }: Context) => {
    await requireAdmin(request);
    const { id } = await params;
    const input = await readJson<UpdateFaqQuestionInput>(request);
    const question = await updateFaqQuestion(id, input);
    invalidatePublicFaq();
    return success(question);
});

export const DELETE = withHandler(async (request, { params }: Context) => {
    await requireAdmin(request);
    const { id } = await params;
    const result = await deleteFaqQuestion(id);
    invalidatePublicFaq();
    return success(result);
});
