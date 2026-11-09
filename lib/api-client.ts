import {
    ApiResponse,
    AssignUserRoleInput,
    CreateOrderInput,
    EventDetail,
    EventInput,
    EventSummary,
    EventTicketInput,
    EventTicketItem,
    OrderDetail,
    OverviewReport,
    ProductInput,
    ScanTicketInput,
    StoreDetail,
    StoreSellInput,
    TicketItem,
    User as Profile,
    UserInput,
    WalletDetail,
    WalletHistoryItem,
    WalletTransactionInput,
} from "@/lib/api-types";

async function request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
    const url = resolveApiUrl(path);

    try {
        const res = await fetch(url, {
            ...init,
            headers: { "Content-Type": "application/json", ...init?.headers },
        });
        return (await res.json()) as ApiResponse<T>;
    } catch {
        return { success: false, error: { code: "NETWORK_ERROR", message: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่" } };
    }
}

function resolveApiUrl(path: string): string {
    if (typeof window !== "undefined") {
        return path;
    }

    const baseUrl = process.env.APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

    return new URL(path, baseUrl).toString();
}

export const api = {
    me: {
        get: () => request<Profile>("/api/me"),
        update: (input: UserInput) => request<Profile>("/api/me", { method: "PATCH", body: JSON.stringify(input) }),
        tickets: () => request<TicketItem[]>("/api/me/tickets"),
        wallet: () => request<WalletDetail>("/api/me/wallet"),
    },
    events: {
        list: () => request<EventSummary[]>("/api/events"),
        get: (slug: string) => request<EventDetail>(`/api/events/${encodeURIComponent(slug)}`),
        create: (input: EventInput) => request<EventDetail>(`/api/admin/events`, { method: "POST", body: JSON.stringify(input) }),
        update: (id: string, input: Partial<EventInput>) =>
            request<EventDetail>(`/api/admin/events/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }),
        drop: (id: string) => request<EventDetail>(`/api/admin/events/${encodeURIComponent(id)}`, { method: "DELETE" }),
        tickets: {
            list: (eventId: string) => request<EventTicketItem[]>(`/api/admin/events/${encodeURIComponent(eventId)}/tickets`),
            create: (eventId: string, input: EventTicketInput) =>
                request<EventTicketItem>(`/api/admin/events/${encodeURIComponent(eventId)}/tickets`, {
                    method: "POST",
                    body: JSON.stringify(input),
                }),
            update: (eventId: string, ticketId: string, input: Partial<EventTicketInput>) =>
                request<EventTicketItem>(
                    `/api/admin/events/${encodeURIComponent(eventId)}/tickets/${encodeURIComponent(ticketId)}`,
                    { method: "PATCH", body: JSON.stringify(input) }
                ),
            drop: (eventId: string, ticketId: string) =>
                request<{ id: string }>(
                    `/api/admin/events/${encodeURIComponent(eventId)}/tickets/${encodeURIComponent(ticketId)}`,
                    { method: "DELETE" }
                ),
        },
    },
    orders: {
        listMy: () => request<OrderDetail[]>("/api/orders"),
        create: (input: CreateOrderInput) => request<OrderDetail>("/api/orders", { method: "POST", body: JSON.stringify(input) }),
    },
    tickets: {
        scan: (input: ScanTicketInput) => request<TicketItem>("/api/tickets/scan", { method: "POST", body: JSON.stringify(input) }),
    },
    store: {
        getMy: () => request<StoreDetail>("/api/store"),
        updateProduct: (input: ProductInput) => request<StoreDetail>("/api/store", { method: "PATCH", body: JSON.stringify(input) }),
        sell: (input: StoreSellInput) =>
            request<{ storeBalance: string; customerBalance: string }>("/api/store/sell", {
                method: "POST",
                body: JSON.stringify(input),
            }),
    },
    admin: {
        users: {
            list: () => request<Profile[]>("/api/admin/users"),
            assignRole: (userId: string, input: AssignUserRoleInput) =>
                request<Profile>(`/api/admin/users/${encodeURIComponent(userId)}/roles`, {
                    method: "POST",
                    body: JSON.stringify(input),
                }),
        },
        wallet: {
            topup: (input: WalletTransactionInput) =>
                request<WalletDetail>("/api/admin/wallet/topup", { method: "POST", body: JSON.stringify(input) }),
            refund: (input: WalletTransactionInput) =>
                request<WalletDetail>("/api/admin/wallet/refund", { method: "POST", body: JSON.stringify(input) }),
        },
        reports: {
            overview: () => request<OverviewReport>("/api/admin/reports/overview"),
            auditLog: () => request<WalletHistoryItem[]>("/api/admin/reports/audit-log"),
        },
    },
};
