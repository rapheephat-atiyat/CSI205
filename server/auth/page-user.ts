import "server-only";
import { getCurrentUser } from "@/server/auth/current-user";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

// Deduplicate layout/page checks within one render, never between users or requests.
const getPageUser = cache(async () => getCurrentUser(await headers()));

export async function requirePageUser(returnTo: string) {
    const user = await getPageUser();
    if (!user) redirect(`/auth/login?next=${encodeURIComponent(returnTo)}`);
    return user;
}
