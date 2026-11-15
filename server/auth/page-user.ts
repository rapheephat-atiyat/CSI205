import "server-only";
import { getCurrentUser } from "@/server/auth/current-user";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function requirePageUser(returnTo: string) {
    const user = await getCurrentUser(await headers());
    if (!user) redirect(`/auth/login?next=${encodeURIComponent(returnTo)}`);
    return user;
}
