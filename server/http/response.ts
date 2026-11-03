import { ApiFailure, ApiSuccess } from "@/lib/api-types";
import "server-only";

export function success<T>(data: T, status = 200): Response {
    const Body: ApiSuccess<T> = { success: true, data }
    return Response.json(Body, { status })
}

export function fail<T>(code: string, message: string, status: number): Response {
    const body: ApiFailure = { success: false, error: { code, message } };
    return Response.json(body, { status });
}