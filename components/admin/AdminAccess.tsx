"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Permission } from "@/lib/permissions";

type AdminAccess = { eventId: string; eventTitle: string; slug: string; userId: string; permissions: Permission[] };
const Context = createContext<AdminAccess | null>(null);

export function AdminAccessProvider({ children, ...value }: AdminAccess & { children: ReactNode }) {
    return <Context value={value}>{children}</Context>;
}

export function useAdminAccess() {
    const value = useContext(Context);
    if (!value) throw new Error("Admin event context is missing");
    return { ...value, can: (permission: Permission) => value.permissions.includes(permission) };
}
