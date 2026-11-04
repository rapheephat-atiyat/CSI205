import "server-only";
import { requireUser } from "@/server/auth/current-user";
import { type User } from "@/server/database/entities";
import { ApiError } from "@/server/http/errors";
import { Permission } from "@/lib/permissions";
import { Role } from "@/server/database/enums/role.enum";


export type PermissionScope = { eventId?: string; storeId?: string };

export function hasPermission(user: User, perms: Permission, scope: PermissionScope = {}): boolean {
    return user.userRoles.some((r) => {
        if (r.role === Role.ADMIN && r.eventId === null && r.storeId === null) return true;
        if (!r.permissions.some((p) => p.permission === perms)) return false;
        if (r.eventId === null && r.storeId === null) return true;
        if (r.storeId && r.storeId === scope.storeId) return true;
        if (scope.eventId && r.eventId === scope.eventId && r.storeId === null) return true;
        return false;
    })
}

export async function requirePermission(
    request: Request,
    permission: Permission,
    scope?: PermissionScope,
): Promise<User> {
    const user = await requireUser(request);
    if (!hasPermission(user, permission, scope)) {
        throw new ApiError("FORBIDDEN", "คุณไม่มีสิทธิ์ทำรายการนี้", 403);
    }
    return user;
}