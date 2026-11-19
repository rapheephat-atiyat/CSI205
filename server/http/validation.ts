import "server-only";
import { ApiError } from "./errors";

export function readUuid(value: unknown, label = "รหัส") {
    if (typeof value !== "string" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)) {
        throw new ApiError("VALIDATION_ERROR", `${label}ไม่ถูกต้อง`, 422);
    }
    return value;
}

export function readText(value: unknown, label: string, max = 255) {
    if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
        throw new ApiError("VALIDATION_ERROR", `กรุณาระบุ${label}ไม่เกิน ${max} ตัวอักษร`, 422);
    }
    return value.trim();
}
