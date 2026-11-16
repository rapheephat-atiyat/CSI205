import "server-only";

import type { User as Profile, UserInput } from "@/lib/api-types";
import { User } from "@/server/database/entities";
import { getDatabase } from "@/server/database/database.souce";
import { ApiError } from "@/server/http/errors";
import { Not } from "typeorm";

function optionalText(value: unknown): string | null {
    if (value == null) return null;
    if (typeof value !== "string") throw new ApiError("VALIDATION_ERROR", "ข้อมูลโปรไฟล์ต้องเป็นข้อความ", 422);
    return value.trim() || null;
}

export async function getMe(id: string): Promise<Profile> {
    const db = await getDatabase();
    const repo = db.getRepository(User);
    const user = await repo.findOne({
        where: {
            id,
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

    const db = await getDatabase();
    const repo = db.getRepository(User);
    const user = await repo.findOneBy({ id });
    if (!user) throw new ApiError("USER_NOT_FOUND", "ไม่พบข้อมูลผู้ใช้", 404);

    if (input.name !== undefined) {
        const trimmedName = optionalText(input.name);
        if (!trimmedName) {
            throw new ApiError("VALIDATION_ERROR", "กรุณาระบุชื่อแสดงผล", 422);
        }
        user.name = trimmedName;
    }

    if (input.username !== undefined) {
        const username = optionalText(input.username);
        if (username) {
            const exists = await repo.existsBy({ username, id: Not(id) });
            if (exists) {
                throw new ApiError("USERNAME_TAKEN", "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว", 409);
            }
        }
        user.username = username;
    }

    if (input.phone !== undefined) {
        const rawPhone = optionalText(input.phone);
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
        const graduationDate = optionalText(input.graduationAt);
        if (!graduationDate) {
            user.graduationAt = null;
        } else {
            const parsed = new Date(graduationDate);
            if (Number.isNaN(parsed.getTime())) {
                throw new ApiError("VALIDATION_ERROR", "รูปแบบวันที่จบการศึกษาไม่ถูกต้อง", 422);
            }
            user.graduationAt = parsed;
        }
    }

    if (input.image !== undefined) {
        user.image = optionalText(input.image);
    }

    if (input.firstName !== undefined) {
        const trimmedFirstName = optionalText(input.firstName);
        if (!trimmedFirstName) {
            throw new ApiError("VALIDATION_ERROR", "ชื่อไม่ควรว่าง", 422);
        }
        user.firstName = trimmedFirstName;
    }

    if (input.lastName !== undefined) {
        const trimmedLastName = optionalText(input.lastName);
        if (!trimmedLastName) {
            throw new ApiError("VALIDATION_ERROR", "นามสกุลไม่ควรว่าง", 422);
        }
        user.lastName = trimmedLastName;
    }

    if (input.graduationInstitution !== undefined) {
        user.graduationInstitution = optionalText(input.graduationInstitution);
    }

    await repo.save(user);
    return getMe(id);
}

export function toProfile(user: User): Profile {
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
        roles: user.userRoles.map((assignment) => ({
            id: assignment.id,
            eventId: assignment.eventId,
            storeId: assignment.storeId,
            permissions: assignment.permissions.map((grant) => grant.permission),
            role: assignment.role,
        })),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    };
}
