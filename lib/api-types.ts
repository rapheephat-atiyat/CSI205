import { type Permission } from "@/lib/permissions";

export type ApiError = { code: string, message: string };
export type ApiSuccess<T> = { success: true, data: T };
export type ApiFailure = { success: false, error: ApiError };

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type UserRoleName = "ADMIN" | "VENDOR" | "STAFF" | "USER";

export type EventSummary = {
    id: string;
    slug: string;
    title: string;
    subTitle: string;
    thumbnail: string;
    venue: string;
    tags: string[];
    buyAt: string;
    buyEndAt: string;
};

export type EventDetail = EventSummary & {
    banner: string;
    description: string;
    minTicketQTY: number;
    maxTicketQTY: number;
    sessions: { id: string }[];
    stores: { id: string; name: string; description: string | null; thumbnail: string | null }[];
};

export type EventInput = {
    slug: string;
    title: string;
    subTitle: string;
    banner: string;
    thumbnail: string;
    venue: string;
    description: string;
    tags: string[];
    buyAt: string;
    buyEndAt: string;
    minTicketQTY: number;
    maxTicketQTY: number;
}

export type UserRoleAssignment = {
    id: string;
    role: UserRoleName;
    eventId: string | null;
    storeId: string | null;
    permissions: Permission[];
};

export type User = {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    username: string | null;
    firstName: string;
    lastName: string;
    phone: string | null;
    graduationAt: string | null;
    graduationInstitution: string | null;
    status: "ACTIVE" | "SUSPENDED";
    walletBalance: string;
    roles: UserRoleAssignment[];
    createdAt: string;
    updatedAt: string;
}

export type UserInput = {
    name?: string;
    image?: string | null;
    username?: string | null;
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    graduationAt?: string | null;
    graduationInstitution?: string | null;
};
