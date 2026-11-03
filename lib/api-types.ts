export type ApiError = { code: string, message: string };
export type ApiSuccess<T> = { success: true, data: T };
export type ApiFailure = { success: false, error: ApiError };

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;



export type EventSummary = {
    id: string;
    slug: string;
    title: string;
    subTitle: string;
    thumnail: string;
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
    thumnail: string;
    vanue: string;
    description: string;
    tags: string[];
    buyAt: string;
    buyendAt: string;
    minTicketQTY: number;
    maxTicketQTY: number;
}