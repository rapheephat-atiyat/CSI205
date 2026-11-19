import "server-only";
import type { AssignUserRoleInput, User as Profile } from "@/lib/api-types";
import { getDatabase } from "@/server/database/database.souce";
import { Events, Store, User, UserRole, UserRolePermission } from "@/server/database/entities";
import { Role } from "@/server/database/enums/role.enum";
import { getMe, toProfile } from "@/server/services/auth.service";
import { ApiError } from "@/server/http/errors";
import { PERMISSIONS } from "@/lib/permissions";
import { IsNull } from "typeorm";

export async function listUsers(): Promise<Profile[]> {
    const db = await getDatabase();
    const users = await db.getRepository(User).find({
        relations: { wallet: true, userRoles: { permissions: true } },
        order: { createdAt: "DESC" },
    });

    return users.map(toProfile);
}

export async function assignRoleToUser(userId: string, input: AssignUserRoleInput): Promise<Profile> {
    const role = Object.values(Role).find((value) => value === input.role);
    if (!role || !Array.isArray(input.permissions) || input.permissions.some((permission) => !Object.values(PERMISSIONS).includes(permission))) {
        throw new ApiError("VALIDATION_ERROR", "บทบาทหรือสิทธิ์ที่เลือกไม่ถูกต้อง", 422);
    }

    const db = await getDatabase();
    await db.transaction(async (manager) => {
        const user = await manager.findOne(User, { where: { id: userId }, lock: { mode: "pessimistic_write" } });
        if (!user) throw new ApiError("USER_NOT_FOUND", "ไม่พบผู้ใช้", 404);
        const eventId = input.eventId ?? null;
        const storeId = input.storeId ?? null;
        if (eventId && !await manager.existsBy(Events, { id: eventId })) {
            throw new ApiError("EVENT_NOT_FOUND", "ไม่พบงานที่ต้องการ", 404);
        }
        if (storeId) {
            const store = await manager.findOneBy(Store, { id: storeId });
            if (!store) throw new ApiError("STORE_NOT_FOUND", "ไม่พบร้านค้า", 404);
            if (eventId && store.eventId !== eventId) {
                throw new ApiError("VALIDATION_ERROR", "ร้านค้านี้อยู่คนละงานกับที่เลือก", 422);
            }
        }

        const scope = storeId ? { storeId } : { storeId: IsNull(), eventId: eventId ?? IsNull() };
        const alreadyAssigned = await manager.existsBy(UserRole, { userId, role, ...scope });
        if (alreadyAssigned) throw new ApiError("ROLE_ALREADY_ASSIGNED", "ผู้ใช้นี้มีบทบาทนั้นแล้ว", 409);

        const savedRole = await manager.save(UserRole, { userId, role, eventId, storeId });
        if (input.permissions.length > 0) {
            await manager.insert(UserRolePermission, [...new Set(input.permissions)].map((permission) => ({
                userRoleId: savedRole.id, permission,
            })));
        }
    });

    return getMe(userId);
}
