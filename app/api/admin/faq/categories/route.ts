import type { FaqCategoryInput } from "@/lib/api-types";
import { requireAdmin } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { success } from "@/server/http/response";
import { createFaqCategory } from "@/server/services/faq.service";
import { invalidatePublicFaq } from "@/server/cache/tags";

export const POST = withHandler(async (request) => {
    await requireAdmin(request);
    const input = await readJson<FaqCategoryInput>(request);
    const category = await createFaqCategory(input);
    invalidatePublicFaq();
    return success(category, 201);
});
