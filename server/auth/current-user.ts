import "server-only";
import { getAuth } from "@/lib/auth";
import { getDatabase } from "@/server/database/database.souce";
import { User } from "@/server/database/entities";
import { ApiError } from "@/server/http/errors";

export async function getCurrentUser(requestHeaders: Headers): Promise<User | null> {
    const session = await getAuth().api.getSession({ headers: requestHeaders });
    if (!session) {
        return null;
    }
    const db = await getDatabase();
    const user = await db.getRepository(User).findOne({
        where: { id: session.user.id },
        relations: { userRoles: { permissions: true } },
    });
    if (!user || user.status !== "ACTIVE") {
        return null;
    }
    return user;
}

export async function requireUser(request: Request): Promise<User> {
    const session = await getAuth().api.getSession({ headers: request.headers });
    if (!session) {
        throw new ApiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    const db = await getDatabase();
    const user = await db.getRepository(User).findOne({
        where: { id: session.user.id },
        relations: { userRoles: { permissions: true } },
    });
    if (!user || user.status !== "ACTIVE") {
        throw new ApiError("ACCOUNT_SUSPENDED", "บัญชีนี้ถูกระงับการใช้งาน", 403);
    }
    return user;
}
