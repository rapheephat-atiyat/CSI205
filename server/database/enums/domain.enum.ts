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

export const ATTENDEE_FIELDS = {
    FIRST_NAME: "firstName",
    LAST_NAME: "lastName",
    PHONE: "phone",
    EMAIL: "email",
    GRADUATION_YEAR: "graduationYear",
} as const;
export type AttendeeField = (typeof ATTENDEE_FIELDS)[keyof typeof ATTENDEE_FIELDS];

export const ORDER_STATUSES = {
    PENDING: "PENDING",
    PAID: "PAID",
    CANCELLED: "CANCELLED",
} as const;
export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];

export const TICKET_STATUSES = {
    PENDING: "PENDING",
    ACTIVE: "ACTIVE",
    USED: "USED",
    CANCELLED: "CANCELLED",
} as const;
export type TicketStatus = (typeof TICKET_STATUSES)[keyof typeof TICKET_STATUSES];

export const DELIVERY_METHODS = {
    NONE: "NONE",
    PICKUP: "PICKUP",
    SHIPPING: "SHIPPING",
} as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[keyof typeof DELIVERY_METHODS];

export const SHIPPING_STATUSES = {
    PENDING: "PENDING",
    PREPARING: "PREPARING",
    SHIPPED: "SHIPPED",
    DELIVERED: "DELIVERED",
} as const;
export type ShippingStatus = (typeof SHIPPING_STATUSES)[keyof typeof SHIPPING_STATUSES];
