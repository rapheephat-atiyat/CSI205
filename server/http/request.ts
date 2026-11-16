import "server-only";
import { ApiError } from "./errors";

export async function readJson<T>(request: Request): Promise<T> {
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw new ApiError("VALIDATION_ERROR", "กรุณาส่งข้อมูลเป็น JSON object", 422);
    }
    return body as T;
}
