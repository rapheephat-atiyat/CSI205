import "server-only";
import type { EntityManager } from "typeorm";
import { AdminActivity } from "@/server/database/entities";

export async function recordAdminActivity(manager: EntityManager, actorId: string | undefined, eventId: string | null, action: string, targetId: string, note?: string | null) {
    if (actorId) await manager.insert(AdminActivity, { actorId, eventId, action, targetId, note: note ?? null });
}
