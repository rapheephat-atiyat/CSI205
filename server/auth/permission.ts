import "server-only";
import { requireUser } from "@/server/auth/current-user";
import { type User } from "@/server/database/entities";
import { ApiError } from "@/server/http/errors";
import type { Permission } from "@/lib/permissions";
import { Role } from "@/server/database/enums/role.enum";


export type PermissionScope = { eventId?: string; storeId?: string };

export function hasPermission(user: User, perms: Permission, scope: PermissionScope = {}): boolean {
    return user.userRoles.some((role) => {
        const globalRole = role.eventId === null && role.storeId === null;
        if (globalRole && role.role === Role.ADMIN) return true;
        if (!role.permissions.some((grant) => grant.permission === perms)) return false;
        if (globalRole) return true;
        if (role.storeId) return role.storeId === scope.storeId;
        return role.eventId === scope.eventId;
    });
}

export function checkPermission(user: User, permission: Permission, scope?: PermissionScope) {
    if (!hasPermission(user, permission, scope)) {
        throw new ApiError("FORBIDDEN", "คุณไม่มีสิทธิ์ทำรายการนี้", 403);
    }
}

export async function requirePermission(
    request: Request,
    permission: Permission,
    scope?: PermissionScope,
): Promise<User> {
    const user = await requireUser(request);
    checkPermission(user, permission, scope);
    return user;
}

/** FAQ เป็นข้อมูลกลางของระบบ จึงให้เฉพาะ ADMIN ที่ไม่มีขอบเขตงานหรือร้านค้าจัดการ */
export async function requireAdmin(request: Request): Promise<User> {
    const user = await requireUser(request);
    const isAdmin = user.userRoles.some((role) =>
        role.role === Role.ADMIN && role.eventId === null && role.storeId === null
    );
    if (!isAdmin) {
        throw new ApiError("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้นที่ทำรายการนี้ได้", 403);
    }
    return user;
}
