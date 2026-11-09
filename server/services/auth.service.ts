import "server-only";

import { User as Profile, UserInput } from "@/lib/api-types";
import { User } from "@/server/database/entities";
import { getDatabase } from "@/server/database/database.souce";
import { ApiError } from "@/server/http/errors";
import { Not } from "typeorm";

function normalizeNullableString(value: string | null | undefined): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

export async function getMe(id: string): Promise<Profile> {
    const repo = (await getDatabase()).getRepository(User);
    const user = await repo.findOne({
        where: {
            id: id,
        },
        relations: {
            wallet: true,
            userRoles: { permissions: true },
        },
    });

    if (!user) {
        throw new ApiError("USER_NOT_FOUND", "ไม่พบข้อมูลผู้ใช้", 404);
    }

    return toProfile(user);
}

export async function updateMe(id: string, input: UserInput): Promise<Profile> {
    if (Object.keys(input).length === 0) {
        throw new ApiError("VALIDATION_ERROR", "ไม่มีข้อมูลที่ต้องแก้ไข", 422);
    }

    const repo = (await getDatabase()).getRepository(User);
    const user = await repo.findOneBy({ id });
    if (!user) throw new ApiError("USER_NOT_FOUND", "ไม่พบข้อมูลผู้ใช้", 404);

    if (input.name !== undefined) {
        const trimmedName = input.name.trim();
        if (!trimmedName) {
            throw new ApiError("VALIDATION_ERROR", "กรุณาระบุชื่อแสดงผล", 422);
        }
        user.name = trimmedName;
    }

    if (input.username !== undefined) {
        const username = normalizeNullableString(input.username) ?? null;
        if (username) {
            const exists = await repo.findOne({
                where: { username, id: Not(id) },
            });
            if (exists) {
                throw new ApiError("USERNAME_TAKEN", "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว", 409);
            }
        }
        user.username = username;
    }

    if (input.phone !== undefined) {
        const rawPhone = normalizeNullableString(input.phone) ?? null;
        if (rawPhone === null) {
            user.phone = null;
        } else {
            const digits = rawPhone.replace(/\D/g, "");
            if (digits.length !== 10) {
                throw new ApiError("VALIDATION_ERROR", "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก", 422);
            }
            user.phone = digits;
        }
    }

    if (input.graduationAt !== undefined) {
        if (input.graduationAt === null || input.graduationAt.trim() === "") {
            user.graduationAt = null;
        } else {
            const parsed = new Date(input.graduationAt);
            if (Number.isNaN(parsed.getTime())) {
                throw new ApiError("VALIDATION_ERROR", "รูปแบบวันที่จบการศึกษาไม่ถูกต้อง", 422);
            }
            user.graduationAt = parsed;
        }
    }

    if (input.image !== undefined) {
        user.image = normalizeNullableString(input.image) ?? null;
    }

    if (input.firstName !== undefined) {
        const trimmedFirstName = input.firstName.trim();
        if (!trimmedFirstName) {
            throw new ApiError("VALIDATION_ERROR", "ชื่อไม่ควรว่าง", 422);
        }
        user.firstName = trimmedFirstName;
    }

    if (input.lastName !== undefined) {
        const trimmedLastName = input.lastName.trim();
        if (!trimmedLastName) {
            throw new ApiError("VALIDATION_ERROR", "นามสกุลไม่ควรว่าง", 422);
        }
        user.lastName = trimmedLastName;
    }

    if (input.graduationInstitution !== undefined) {
        user.graduationInstitution = normalizeNullableString(input.graduationInstitution) ?? null;
    }

    await repo.save(user);
    return getMe(id);
}

function toProfile(user: User): Profile {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        graduationAt: user.graduationAt ? user.graduationAt.toISOString() : null,
        graduationInstitution: user.graduationInstitution,
        status: user.status,
        walletBalance: user.wallet?.total ?? "0.00",
        roles: user.userRoles.map((r) => ({
            id: r.id,
            eventId: r.eventId,
            storeId: r.storeId,
            permissions: r.permissions.map((p) => p.permission),
            role: r.role,
        })),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    };
}
