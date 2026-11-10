import { ApiError } from "@/server/http/errors";
import { fail } from "@/server/http/response";
import "server-only";

export function withHandler<Context>(handler: (req: Request, ctx: Context) => Promise<Response>) {
    return async (request: Request, context: Context): Promise<Response> => {
        try {
            return await handler(request, context);
        } catch (error) {
            if (error instanceof ApiError) {
                return fail(error.code, error.message, error.status);
            }
            console.error(error);
            return fail("INTERNAL_ERROR", "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง", 500);
        }
    };
}