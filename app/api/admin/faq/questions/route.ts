import type { FaqQuestionInput } from "@/lib/api-types";
import { requireAdmin } from "@/server/auth/permission";
import { withHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { success } from "@/server/http/response";
import { createFaqQuestion } from "@/server/services/faq.service";

export const POST = withHandler(async (request) => {
    await requireAdmin(request);
    const input = await readJson<FaqQuestionInput>(request);
    return success(await createFaqQuestion(input), 201);
});
