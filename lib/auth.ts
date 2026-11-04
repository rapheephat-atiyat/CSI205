import "server-only";

import { randomUUID } from "node:crypto";
import { APIError, betterAuth } from "better-auth";
import { Pool } from "pg";
import { getDatabase } from "@/server/database/database.souce";
import { User, UserRole, Wallet } from "@/server/database/entities";
import { Role } from "@/server/database/enums/role.enum";

function normalizeOptionalText(value: unknown): string | null | undefined {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function createAuth() {
    const {
        DATABASE,
        BETTER_AUTH_SECRET,
        BETTER_AUTH_URL,
    } = process.env;

    if (!DATABASE || !BETTER_AUTH_SECRET || !BETTER_AUTH_URL) {
        throw new Error("Missing authentication environment variables.");
    }

    if (BETTER_AUTH_SECRET.length < 32) {
        throw new Error("BETTER_AUTH_SECRET must have at least 32 characters.");
    }

    const timestamps = {
        createdAt: "created_at",
        updatedAt: "updated_at",
    };

    return betterAuth({
        appName: "TUATUA",
        secret: BETTER_AUTH_SECRET,
        baseURL: BETTER_AUTH_URL,
        trustedOrigins: [new URL(BETTER_AUTH_URL).origin],

        database: new Pool({
            connectionString: DATABASE,
            max: 3,
            connectionTimeoutMillis: 10_000,
            idleTimeoutMillis: 30_000,
        }),

        advanced: {
            database: {
                generateId: () => randomUUID(),
            },
        },

        emailAndPassword: {
            enabled: true,
            minPasswordLength: 8,
            requireEmailVerification: false,
        },

        user: {
            modelName: "users",
            fields: timestamps,
            additionalFields: {
                username: { type: "string", required: false },
                firstName: { type: "string", required: false },
                lastName: { type: "string", required: false },
                phone: { type: "string", required: false },
                graduationAt: { type: "date", required: false },
                graduationInstitution: { type: "string", required: false },
                status: { type: "string", required: false, defaultValue: "ACTIVE", input: false },
            },
        },

        databaseHooks: {
            user: {
                create: {
                    before: async (user) => {
                        const username = normalizeOptionalText(user.username);
                        if (username) {
                            const db = await getDatabase();
                            const existingUsername = await db.getRepository(User).findOneBy({ username });
                            if (existingUsername) {
                                throw new APIError("CONFLICT", { message: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" });
                            }
                        }

                        let phone: string | null | undefined;
                        if (typeof user.phone === "string") {
                            const trimmedPhone = user.phone.trim();
                            if (trimmedPhone.length === 0) {
                                phone = null;
                            } else {
                                const digits = trimmedPhone.replace(/\D/g, "");
                                if (digits.length !== 10) {
                                    throw new APIError("BAD_REQUEST", { message: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก" });
                                }
                                phone = digits;
                            }
                        }

                        return {
                            data: {
                                ...user,
                                ...(username !== undefined ? { username } : {}),
                                ...(phone !== undefined ? { phone } : {}),
                                ...(user.firstName !== undefined ? { firstName: normalizeOptionalText(user.firstName) } : {}),
                                ...(user.lastName !== undefined ? { lastName: normalizeOptionalText(user.lastName) } : {}),
                                ...(user.graduationInstitution !== undefined
                                    ? { graduationInstitution: normalizeOptionalText(user.graduationInstitution) }
                                    : {}),
                            },
                        };
                    },
                    after: async (user) => {
                        const db = await getDatabase();
                        await db.transaction(async (manager) => {
                            await manager.getRepository(UserRole).save(
                                manager.getRepository(UserRole).create({
                                    userId: user.id,
                                    role: Role.USER,
                                }),
                            );
                            await manager.getRepository(Wallet).save(
                                manager.getRepository(Wallet).create({
                                    userId: user.id,
                                    total: "0.00",
                                }),
                            );
                        });
                    },
                },
            },
            session: {
                create: {
                    before: async (session) => {
                        const db = await getDatabase();
                        const dbUser = await db.getRepository(User).findOneBy({ id: session.userId });
                        if (!dbUser || dbUser.status !== "ACTIVE") {
                            throw new APIError("FORBIDDEN", { message: "บัญชีนี้ถูกระงับการใช้งาน" });
                        }
                    },
                },
            },
        },

        session: {
            modelName: "sessions",
            fields: {
                ...timestamps,
                userId: "user_id",
            },
        },

        account: {
            modelName: "accounts",
            fields: {
                ...timestamps,
                userId: "user_id",
            },
        },

        verification: {
            modelName: "verifications",
            fields: timestamps,
        },
    });
}

export type Auth = ReturnType<typeof getAuth>;

const authCache = globalThis as typeof globalThis & {
    tuatuaAuth?: ReturnType<typeof createAuth>;
};

export function getAuth() {
    return authCache.tuatuaAuth ??= createAuth();
}
