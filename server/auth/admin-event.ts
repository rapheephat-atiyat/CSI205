import "server-only";
import type { Permission } from "@/lib/permissions";
import { requireEventAdmin } from "./permission";
import { readUuid } from "@/server/http/validation";

export async function authorizeAdminEvent<P extends { id: string }>(request: Request, params: Promise<P>, permission: Permission) {
    const values = await params;
    const user = await requireEventAdmin(request, permission, values.id);
    readUuid(values.id, "รหัสงาน");
    return { ...values, user };
}
