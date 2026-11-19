import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requirePageUser } from "@/server/auth/page-user";
import { hasPermission } from "@/server/auth/permission";
import { PERMISSIONS } from "@/lib/permissions";

export default async function CreateEventLayout({ children }: { children: React.ReactNode }) {
    await connection();
    const user = await requirePageUser("/admin/create");
    if (!hasPermission(user, PERMISSIONS.EVENT_CREATE)) redirect("/admin");
    return children;
}
