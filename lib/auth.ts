import "server-only";

import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { Pool } from "pg";

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

const authCache = globalThis as typeof globalThis & {
    tuatuaAuth?: ReturnType<typeof createAuth>;
};

export function getAuth() {
    return authCache.tuatuaAuth ??= createAuth();
}