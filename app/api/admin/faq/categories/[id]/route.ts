import type { UpdateFaqCategoryInput } from "@/lib/api-types";
import { requireAdmin } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { success } from "@/server/http/response";
import { deleteFaqCategory, getFaqCategory, updateFaqCategory } from "@/server/services/faq.service";
import { invalidatePublicFaq } from "@/server/cache/tags";

type Context = { params: Promise<{ id: string }> };

export const GET = withHandler(async (request, { params }: Context) => {
    await requireAdmin(request);
    const { id } = await params;
    const response = success(await getFaqCategory(id));
    response.headers.set("Cache-Control", "no-store");
    return response;
});

export const PATCH = withHandler(async (request, { params }: Context) => {
    await requireAdmin(request);
    const { id } = await params;
    const input = await readJson<UpdateFaqCategoryInput>(request);
    const category = await updateFaqCategory(id, input);
    invalidatePublicFaq();
    return success(category);
});

export const DELETE = withHandler(async (request, { params }: Context) => {
    await requireAdmin(request);
    const { id } = await params;
    const result = await deleteFaqCategory(id);
    invalidatePublicFaq();
    return success(result);
});
