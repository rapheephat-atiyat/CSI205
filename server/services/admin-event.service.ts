import "server-only";
import type { AdminActivityItem, AdminExportTicket, AdminStore, AdminUser, AssignUserRoleInput, EventOverviewReport, StoreInput } from "@/lib/api-types";
import { EVENT_ADMIN_PERMISSIONS, PERMISSIONS, type Permission } from "@/lib/permissions";
import { hasPermission } from "@/server/auth/permission";
import { getDatabase } from "@/server/database/database.souce";
import { AdminActivity, Events, Order, Store, Ticket, User, UserRole, UserRolePermission, Wallet, WalletHistory } from "@/server/database/entities";
import { Role } from "@/server/database/enums/role.enum";
import { ApiError } from "@/server/http/errors";
import { readText, readUuid } from "@/server/http/validation";
import { IsNull } from "typeorm";
import { toStoreDetail } from "./store.service";
import { toProfile } from "./auth.service";
import { recordAdminActivity } from "./admin-activity";
import { getOverviewReport } from "./report.service";
import { releaseExpiredOrderHolds } from "./order.service";
import { getEventTickets } from "./ticket.service";

export async function getAdminTicketReport(eventId: string): Promise<AdminExportTicket[]> {
    const db = await getDatabase();
    const [types, totals] = await Promise.all([
        getEventTickets(eventId),
        db.getRepository(Ticket).createQueryBuilder("t").innerJoin("t.order", "o")
            .select("t.eventTicketId", "id").addSelect("COUNT(*)", "count").addSelect("SUM(t.unitPrice)", "revenue")
            .where("t.eventId = :eventId AND o.status = 'PAID' AND t.status IN ('ACTIVE', 'USED')", { eventId }).groupBy("t.eventTicketId").getRawMany<{ id: string; count: string; revenue: string }>(),
    ]);
    return types.map((type) => { const total = totals.find((entry) => entry.id === type.id); return { ...type, paidTickets: Number(total?.count ?? 0), paidRevenue: total?.revenue ?? "0.00" }; });
}

export async function ensureEvent(eventId: string) {
    if (!await (await getDatabase()).getRepository(Events).existsBy({ id: eventId })) throw new ApiError("EVENT_NOT_FOUND", "ไม่พบงานนี้", 404);
}

export async function getEventOverview(eventId: string): Promise<EventOverviewReport> {
    await ensureEvent(eventId);
    await releaseExpiredOrderHolds({ eventId });
    const db = await getDatabase();
    const [overview, paidOrders, pending, pendingTickets, buckets] = await Promise.all([
        getOverviewReport(eventId),
        db.getRepository(Order).countBy({ eventId, status: "PAID" }),
        db.getRepository(Order).createQueryBuilder("o").select('COUNT(*)', "count").addSelect('COALESCE(SUM(o.total), 0)', "amount")
            .where("o.eventId = :eventId AND o.status = 'PENDING' AND o.paymentSlip IS NOT NULL", { eventId }).getRawOne<{ count: string; amount: string }>(),
        db.getRepository(Ticket).createQueryBuilder("t").innerJoin("t.order", "o")
            .where("t.eventId = :eventId AND o.status = 'PENDING' AND o.paymentSlip IS NOT NULL", { eventId }).getCount(),
        db.getRepository(Ticket).createQueryBuilder("t").select(`to_char(t.checkedInAt AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD HH24:00')`, "time")
            .addSelect("COUNT(*)", "attendees").where("t.eventId = :eventId AND t.checkedInAt IS NOT NULL", { eventId })
            .groupBy("1").orderBy("1", "DESC").limit(24).getRawMany<{ time: string; attendees: string }>(),
    ]);
    return { ...overview, paidOrders, pendingOrders: Number(pending?.count ?? 0), pendingTickets, pendingAmount: Number(pending?.amount ?? 0).toFixed(2), checkIns: buckets.reverse().map((bucket) => ({ time: bucket.time, attendees: Number(bucket.attendees) })) };
}

export async function getAdminActivities(eventId: string): Promise<AdminActivityItem[]> {
    await ensureEvent(eventId);
    const rows = await (await getDatabase()).getRepository(AdminActivity).find({ where: { eventId }, relations: { actor: true }, order: { createdAt: "DESC", id: "DESC" }, take: 200 });
    return rows.map((row) => ({ id: row.id, eventId: row.eventId, actorId: row.actorId, actorName: row.actor?.name ?? null, action: row.action, targetId: row.targetId, note: row.note, createdAt: row.createdAt.toISOString() }));
}

export async function listAdminStores(eventId: string): Promise<AdminStore[]> {
    await ensureEvent(eventId);
    const stores = await (await getDatabase()).getRepository(Store).find({ where: { eventId }, relations: { product: true, wallet: true, userRoles: { user: true } }, order: { createdAt: "ASC" } });
    return stores.map((store) => ({ ...toStoreDetail(store), managers: store.userRoles.filter((role) => role.role === Role.VENDOR).map((role) => ({ id: role.user.id, name: role.user.name, email: role.user.email })) }));
}

export async function updateAdminStore(eventId: string, storeId: string, actorId: string, input: Partial<StoreInput>) {
    readUuid(storeId, "รหัสร้านค้า");
    const name = readText(input.name, "ชื่อร้านค้า");
    if (input.description != null && (typeof input.description !== "string" || input.description.length > 5000)) throw new ApiError("VALIDATION_ERROR", "รายละเอียดร้านค้าไม่ถูกต้อง", 422);
    const db = await getDatabase();
    await db.transaction(async (manager) => {
        const store = await manager.findOne(Store, { where: { id: storeId, eventId }, lock: { mode: "pessimistic_write" } });
        if (!store) throw new ApiError("STORE_NOT_FOUND", "ไม่พบร้านค้าในงานนี้", 404);
        store.name = name;
        if (input.description !== undefined) store.description = input.description?.trim() || null;
        for (const key of ["banner", "thumbnail"] as const) {
            if (input[key] !== undefined) {
                if (input[key] !== null && (typeof input[key] !== "string" || input[key].length > 2_800_000)) throw new ApiError("VALIDATION_ERROR", "รูปภาพร้านค้าไม่ถูกต้อง", 422);
                store[key] = input[key] ?? null;
            }
        }
        await manager.save(store);
        await recordAdminActivity(manager, actorId, eventId, "store.update", storeId);
    });
    return (await listAdminStores(eventId)).find((store) => store.id === storeId)!;
}

export async function deleteAdminStore(eventId: string, storeId: string, actorId: string) {
    readUuid(storeId, "รหัสร้านค้า");
    const db = await getDatabase();
    await db.transaction(async (manager) => {
        const store = await manager.findOne(Store, { where: { id: storeId, eventId }, lock: { mode: "pessimistic_write" } });
        if (!store) throw new ApiError("STORE_NOT_FOUND", "ไม่พบร้านค้าในงานนี้", 404);
        const wallet = await manager.findOne(Wallet, { where: { storeId }, lock: { mode: "pessimistic_write" } });
        if (wallet && (Number(wallet.total) !== 0 || await manager.existsBy(WalletHistory, { walletId: wallet.id }))) throw new ApiError("STORE_HAS_TRANSACTIONS", "ร้านค้ามียอดเงินหรือประวัติธุรกรรม จึงลบไม่ได้", 409);
        if (wallet) await manager.delete(Wallet, { id: wallet.id });
        await manager.delete(Store, { id: storeId, eventId });
        await recordAdminActivity(manager, actorId, eventId, "store.delete", storeId);
    });
    return { id: storeId };
}

export async function listAdminUsers(eventId: string, query = ""): Promise<AdminUser[]> {
    await ensureEvent(eventId);
    if (query.length > 100) throw new ApiError("VALIDATION_ERROR", "คำค้นยาวเกินไป", 422);
    const usersQuery = (await getDatabase()).getRepository(User).createQueryBuilder("u")
        .leftJoinAndSelect("u.userRoles", "r", "r.eventId = :eventId", { eventId }).leftJoinAndSelect("r.permissions", "p")
        .orderBy("u.name", "ASC").addOrderBy("u.id", "ASC").take(200);
    if (query.trim()) usersQuery.where("(u.name ILIKE :query OR u.email ILIKE :query)", { query: `%${query.trim().replace(/[\\%_]/g, "\\$&")}%` });
    return (await usersQuery.getMany()).map((user) => {
        const profile = toProfile(user);
        return { id: profile.id, name: profile.name, email: profile.email, graduationAt: profile.graduationAt, status: profile.status, roles: profile.roles };
    });
}

function readRolePermissions(actor: User, eventId: string, role: string, permissions: unknown): Permission[] {
    const allowed = role === "ADMIN" ? EVENT_ADMIN_PERMISSIONS : role === "STAFF" ? [PERMISSIONS.TICKET_SCAN] : role === "VENDOR" ? [PERMISSIONS.STORE_MANAGE, PERMISSIONS.STORE_SELL] : [];
    if (!Array.isArray(permissions) || permissions.some((permission) => !allowed.includes(permission))) throw new ApiError("VALIDATION_ERROR", "สิทธิ์ไม่ตรงกับบทบาทในงาน", 422);
    if (role !== "VENDOR" && permissions.some((permission) => !hasPermission(actor, permission, { eventId }))) throw new ApiError("FORBIDDEN", "ไม่สามารถมอบสิทธิ์ที่ตัวเองไม่มี", 403);
    return [...new Set(permissions)] as Permission[];
}

export async function assignEventRole(eventId: string, userId: string, actor: User, input: AssignUserRoleInput) {
    readUuid(userId, "รหัสผู้ใช้");
    if (!["ADMIN", "STAFF", "VENDOR"].includes(input.role)) throw new ApiError("VALIDATION_ERROR", "บทบาทไม่ถูกต้อง", 422);
    const permissions = readRolePermissions(actor, eventId, input.role, input.permissions);
    const storeId = input.role === "VENDOR" ? readUuid(input.storeId, "รหัสร้านค้า") : null;
    if (storeId && !hasPermission(actor, PERMISSIONS.STORE_MANAGE, { eventId })) throw new ApiError("FORBIDDEN", "ไม่มีสิทธิ์มอบหมายผู้ดูแลร้านค้า", 403);
    if (input.role !== "VENDOR" && input.storeId) throw new ApiError("VALIDATION_ERROR", "บทบาทนี้ไม่ผูกกับร้านค้า", 422);
    const db = await getDatabase();
    const assignment = await db.transaction(async (manager) => {
        if (!await manager.findOne(Events, { where: { id: eventId }, lock: { mode: "pessimistic_write" } })) throw new ApiError("EVENT_NOT_FOUND", "ไม่พบงานนี้", 404);
        const user = await manager.findOneBy(User, { id: userId, status: "ACTIVE" });
        if (!user) throw new ApiError("USER_NOT_FOUND", "ไม่พบบัญชีที่ใช้งานได้", 404);
        if (storeId && !await manager.existsBy(Store, { id: storeId, eventId })) throw new ApiError("STORE_NOT_FOUND", "ร้านค้าไม่ได้อยู่ในงานนี้", 404);
        const existing = await manager.existsBy(UserRole, { userId, role: input.role as Role, eventId, storeId: storeId ?? IsNull() });
        if (existing) throw new ApiError("ROLE_ALREADY_ASSIGNED", "ผู้ใช้มีบทบาทนี้แล้ว", 409);
        const role = await manager.save(UserRole, { userId, role: input.role as Role, eventId, storeId });
        if (permissions.length) await manager.insert(UserRolePermission, permissions.map((permission) => ({ userRoleId: role.id, permission })));
        await recordAdminActivity(manager, actor.id, eventId, "role.assign", role.id, `${user.name}: ${input.role}`);
        return role.id;
    });
    return { id: assignment };
}

export async function changeEventRole(eventId: string, userId: string, roleId: string, actor: User, permissions?: Permission[]) {
    readUuid(userId, "รหัสผู้ใช้"); readUuid(roleId, "รหัสบทบาท");
    const db = await getDatabase();
    await db.transaction(async (manager) => {
        if (!await manager.findOne(Events, { where: { id: eventId }, lock: { mode: "pessimistic_write" } })) throw new ApiError("EVENT_NOT_FOUND", "ไม่พบงานนี้", 404);
        const role = await manager.findOneBy(UserRole, { id: roleId, userId, eventId });
        if (!role) throw new ApiError("ROLE_NOT_FOUND", "ไม่พบบทบาทในงานนี้", 404);
        if (userId === actor.id) throw new ApiError("SELF_ROLE_CHANGE", "ให้ผู้ดูแลอีกคนแก้สิทธิ์ของคุณ", 409);
        if (permissions === undefined) {
            await manager.delete(UserRole, { id: role.id });
        } else {
            const validated = readRolePermissions(actor, eventId, role.role, permissions);
            await manager.delete(UserRolePermission, { userRoleId: role.id });
            if (validated.length) await manager.insert(UserRolePermission, validated.map((permission) => ({ userRoleId: role.id, permission })));
        }
        await recordAdminActivity(manager, actor.id, eventId, permissions === undefined ? "role.revoke" : "role.update", roleId);
    });
    return { id: roleId };
}
