import "server-only";
import { getDatabase } from "@/server/database/database.souce";
import { Events, Ticket, User, Wallet } from "@/server/database/entities";
import { TICKET_STATUSES } from "@/server/database/enums/domain.enum";
import { PERMISSIONS } from "@/lib/permissions";
import { hasPermission } from "@/server/auth/permission";
import { ApiError } from "@/server/http/errors";
import { adjustUserWallet } from "./wallet.service";
import type { StaffAttendeeItem, StaffOverviewData } from "@/lib/api-types";

export async function getStaffEvent(staff: User): Promise<Events | null> {
    const db = await getDatabase();
    const assignedRole = staff.userRoles.find(
        (r) => r.eventId && r.permissions.some((p) => p.permission === PERMISSIONS.TICKET_SCAN)
    );
    const repo = db.getRepository(Events);
    if (assignedRole?.eventId) {
        return await repo.findOne({
            where: { id: assignedRole.eventId },
            relations: { sessions: true, tickets: true },
        });
    }
    return await repo.findOne({
        where: {},
        order: { createdAt: "DESC" },
        relations: { sessions: true, tickets: true },
    });
}

export async function getStaffOverview(staff: User): Promise<StaffOverviewData> {
    const event = await getStaffEvent(staff);
    if (!event) {
        return {
            total: 0,
            checkedIn: 0,
            checkedOut: 0,
            waiting: 0,
            eventInfo: {
                name: "ไม่พบงานกิจกรรม",
                date: "ยังไม่ได้ระบุวัน",
                capacity: 0,
            },
            recentScans: [],
        };
    }

    const db = await getDatabase();
    const ticketRepo = db.getRepository(Ticket);

    const [total, checkedIn] = await Promise.all([
        ticketRepo.count({
            where: { eventId: event.id, status: TICKET_STATUSES.ACTIVE },
        }).then(async (active) => {
            const used = await ticketRepo.count({ where: { eventId: event.id, status: TICKET_STATUSES.USED } });
            return active + used;
        }),
        ticketRepo.count({
            where: { eventId: event.id, status: TICKET_STATUSES.USED },
        }),
    ]);

    const recentTickets = await ticketRepo.find({
        where: { eventId: event.id, status: TICKET_STATUSES.USED },
        relations: { user: true, eventTicket: true },
        order: { checkedInAt: "DESC" },
        take: 10,
    });

    const recentScans = recentTickets.map((t) => {
        const attendeeName = `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim() || t.user?.name || "ผู้เข้าร่วม";
        const time = t.checkedInAt
            ? new Date(t.checkedInAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
            : "-";
        return {
            id: t.id,
            time,
            attendeeName,
            ticketId: t.ticketCode,
            action: "in" as const,
            outcome: "checked-in" as const,
        };
    });

    const firstSession = event.sessions?.[0];
    const eventDate = firstSession?.startsAt
        ? new Date(firstSession.startsAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })
        : event.buyAt
        ? new Date(event.buyAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })
        : "เร็วๆ นี้";

    const totalCapacity = event.tickets?.reduce((acc, t) => acc + (t.quota || 0), 0) || total || 1000;

    return {
        total,
        checkedIn,
        checkedOut: 0,
        waiting: Math.max(0, total - checkedIn),
        eventInfo: {
            id: event.id,
            name: event.title,
            date: eventDate,
            capacity: totalCapacity,
        },
        recentScans,
        staffProfile: {
            name: staff.name ?? staff.username ?? "Staff",
            role: "เจ้าหน้าที่จุดสแกน",
            topUpQuotaTotal: 5000,
            topUpQuotaUsed: 0,
        },
    };
}

export async function getStaffAttendees(
    staff: User,
    query?: string,
    status?: string
): Promise<StaffAttendeeItem[]> {
    const event = await getStaffEvent(staff);
    if (!event) return [];

    const db = await getDatabase();
    const qb = db.getRepository(Ticket)
        .createQueryBuilder("ticket")
        .leftJoinAndSelect("ticket.user", "user")
        .leftJoinAndSelect("ticket.eventTicket", "eventTicket")
        .where("ticket.eventId = :eventId", { eventId: event.id })
        .andWhere("ticket.status IN (:...allowedStatuses)", {
            allowedStatuses: [TICKET_STATUSES.ACTIVE, TICKET_STATUSES.USED],
        });

    if (query?.trim()) {
        const q = `%${query.trim()}%`;
        qb.andWhere(
            "(ticket.ticketCode ILIKE :q OR ticket.firstName ILIKE :q OR ticket.lastName ILIKE :q OR ticket.phone ILIKE :q OR user.name ILIKE :q)",
            { q }
        );
    }

    if (status === "checked-in") {
        qb.andWhere("ticket.status = :s", { s: TICKET_STATUSES.USED });
    } else if (status === "not-arrived") {
        qb.andWhere("ticket.status = :s", { s: TICKET_STATUSES.ACTIVE });
    }

    qb.orderBy("ticket.updatedAt", "DESC");
    const tickets = await qb.getMany();

    const userIds = Array.from(new Set(tickets.map((t) => t.userId).filter(Boolean)));
    const wallets = userIds.length > 0
        ? await db.getRepository(Wallet).find({ where: userIds.map((userId) => ({ userId })) })
        : [];
    const walletMap = new Map(wallets.map((w) => [w.userId, Number(w.total)]));

    return tickets.map((t) => {
        const name = `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim() || t.user?.name || "ไม่ระบุชื่อ";
        const isCheckedIn = t.status === TICKET_STATUSES.USED;
        const lastActionAt = t.checkedInAt
            ? new Date(t.checkedInAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
            : undefined;

        return {
            id: t.id,
            name,
            ticketId: t.ticketCode,
            ticketType: t.eventTicket?.name ?? "General",
            status: isCheckedIn ? "checked-in" : "not-arrived",
            tokens: walletMap.get(t.userId) ?? 0,
            userId: t.userId,
            lastActionAt,
            phone: t.phone ?? undefined,
            email: t.email ?? undefined,
        };
    });
}

export async function topUpStaffAttendee(
    staff: User,
    input: { attendeeId: string; amount: number; note?: string }
): Promise<{ name: string; amount: number; balance: number }> {
    if (!hasPermission(staff, PERMISSIONS.TOKEN_TOPUP)) {
        throw new ApiError("FORBIDDEN", "คุณไม่มีสิทธิ์เติม Token", 403);
    }
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
        throw new ApiError("VALIDATION_ERROR", "จำนวน Token ต้องเป็นจำนวนเต็มบวก", 422);
    }

    const db = await getDatabase();
    // Look up attendee by ticket id or user id
    let userId = input.attendeeId;
    let attendeeName = "ผู้เข้าร่วม";

    const ticket = await db.getRepository(Ticket).findOne({
        where: [{ id: input.attendeeId }, { ticketCode: input.attendeeId }],
        relations: { user: true },
    });
    if (ticket) {
        userId = ticket.userId;
        attendeeName = `${ticket.firstName ?? ""} ${ticket.lastName ?? ""}`.trim() || ticket.user?.name || attendeeName;
    } else {
        const user = await db.getRepository(User).findOneBy({ id: input.attendeeId });
        if (user) {
            userId = user.id;
            attendeeName = user.name || attendeeName;
        }
    }

    const wallet = await adjustUserWallet(staff.id, "TOPUP", {
        userId,
        amount: String(input.amount),
        note: input.note ?? "เติม Token หน้างานโดยเจ้าหน้าที่",
    });

    return {
        name: attendeeName,
        amount: input.amount,
        balance: Number(wallet.total),
    };
}
