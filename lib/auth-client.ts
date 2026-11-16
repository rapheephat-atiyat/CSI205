"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { Auth } from "@/lib/auth";

/**
 * ใช้สมัครบัญชี เข้าสู่ระบบ ออกจากระบบ หรืออ่าน session ใน Client Component
 * @example await authClient.signIn.email({ email: "user1@tuatua.com", password })
 */
export const authClient = createAuthClient({
    basePath: "/api/auth",
    plugins: [inferAdditionalFields<Auth>()],
});
