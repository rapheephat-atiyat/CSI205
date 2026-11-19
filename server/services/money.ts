import "server-only";
import { ApiError } from "@/server/http/errors";

export function readMoney(value: unknown, allowZero = false): number {
    if ((typeof value !== "string" && typeof value !== "number") || !/^\d{1,8}(\.\d{1,2})?$/.test(String(value).trim())) {
        throw new ApiError("VALIDATION_ERROR", "กรุณาใส่จำนวนเงิน เช่น 120.50", 422);
    }
    const amount = Number(value);
    if (!allowZero && amount === 0) {
        throw new ApiError("VALIDATION_ERROR", "จำนวนเงินต้องมากกว่า 0", 422);
    }
    return amount;
}
