export const EVENT_STATUSES = {
    DRAFT: "DRAFT",
    PUBLISHED: "PUBLISHED",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
} as const;
export type EventStatus = (typeof EVENT_STATUSES)[keyof typeof EVENT_STATUSES];

export const TRANSACTION_TYPES = {
    TOPUP: "TOPUP",
    PURCHASE: "PURCHASE",
    REFUND: "REFUND",
} as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];

export const TRANSACTION_STATUSES = {
    COMPLETED: "COMPLETED",
    PENDING: "PENDING",
    REJECTED: "REJECTED",
} as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[keyof typeof TRANSACTION_STATUSES];