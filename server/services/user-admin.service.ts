import "server-only";
import type { AssignUserRoleInput, User as Profile } from "@/lib/api-types";
import { getDatabase } from "@/server/database/database.souce";
import { User, UserRole, UserRolePermission } from "@/server/database/entities";
import { Role } from "@/server/database/enums/role.enum";
import { getMe } from "@/server/services/auth.service";

export async function listUsers(): Promise<Profile[]> {
    const db = await getDatabase();
    const users = await db.getRepository(User).find({
        relations: { wallet: true, userRoles: { permissions: true } },
        order: { createdAt: "DESC" },
    });

    return users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        emailVerified: u.emailVerified,
        image: u.image,
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        graduationAt: u.graduationAt ? u.graduationAt.toISOString() : null,
        graduationInstitution: u.graduationInstitution,
        status: u.status,
        walletBalance: u.wallet?.total ?? "0.00",
        roles: u.userRoles.map((r) => ({
            id: r.id,
            role: r.role,
            eventId: r.eventId,
            storeId: r.storeId,
            permissions: r.permissions.map((p) => p.permission),
        })),
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
    }));
}

export async function assignRoleToUser(userId: string, input: AssignUserRoleInput): Promise<Profile> {
    const db = await getDatabase();
    await db.transaction(async (manager) => {
        const userRole = manager.create(UserRole, {
            userId,
            role: input.role as Role,
            eventId: input.eventId ?? null,
            storeId: input.storeId ?? null,
        });
        const savedRole = await manager.save(userRole);

        if (input.permissions.length > 0) {
            const perms = input.permissions.map((perm) =>
                manager.create(UserRolePermission, {
                    userRoleId: savedRole.id,
                    permission: perm,
                })
            );
            await manager.save(perms);
        }
    });

    return getMe(userId);
}