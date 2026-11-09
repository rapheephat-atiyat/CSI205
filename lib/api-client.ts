import { ApiResponse, EventDetail, EventInput, EventSummary, User as Profile, UserInput } from "@/lib/api-types";

async function request<T>(
    path: string,
    init?: RequestInit,
): Promise<ApiResponse<T>> {
    const url = resolveApiUrl(path);

    try {
        const res = await fetch(url, {
            ...init,
            headers: {
                "Content-Type": "application/json",
                ...init?.headers,
            },
        });

        return (await res.json()) as ApiResponse<T>;
    } catch {
        return {
            success: false,
            error: {
                code: "NETWORK_ERROR",
                message: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่",
            },
        };
    }
}

function resolveApiUrl(path: string): string {
    if (typeof window !== "undefined") {
        return path;
    }

    const baseUrl = process.env.APP_URL;

    if (!baseUrl) {
        throw new Error("APP_URL is not configured.");
    }

    return new URL(path, baseUrl).toString();
}

export const api = {
    me: {
        get: () => request<Profile>("/api/me"),
        update: (input: UserInput) => request<Profile>("/api/me", { method: "PATCH", body: JSON.stringify(input) }),
    },
    events: {
        list: () => request<EventSummary[]>("/api/events"),
        get: (slug: string) => request<EventDetail>(`/api/events/${encodeURIComponent(slug)}`),
        create: (input: EventInput) => request<EventDetail>(`/api/admin/events`, { method: "POST", body: JSON.stringify(input) }),
        update: (id: string, input: EventInput) => request<EventDetail>(`/api/admin/events/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }),
        drop: (id: string) => request<EventDetail>(`/api/admin/events/${encodeURIComponent(id)}`, { method: "DELETE" }),
    },
};
