import { type Permission } from "@/lib/permissions";
import { AttendeeField, DeliveryMethod, OrderStatus, ShippingStatus, TicketStatus, TransactionStatus, TransactionType } from "@/server/database/enums/domain.enum";

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
    hasSouvenir?: boolean;
    souvenirName?: string | null;
    souvenirImage?: string | null;
    souvenirSizes?: string[];
    souvenirAllowDecline?: boolean;
    allowShipping?: boolean;
    shippingFee?: string;
    sessions: { id: string }[];
    stores: {
        id: string;
        name: string;
        description: string | null;
        thumbnail: string | null;
    }[];
    tickets?: EventTicketItem[];
};

export type EventTicketSummary = {
    id: string;
    name: string;
    price: string;
    isActive: boolean;
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
    hasSouvenir?: boolean;
    souvenirName?: string | null;
    souvenirImage?: string | null;
    souvenirSizes?: string[];
    souvenirAllowDecline?: boolean;
    allowShipping?: boolean;
    shippingFee?: string;
};

export type UserRoleAssignment = {
    id: string;
    role: UserRoleName;
    eventId: string | null;
    storeId: string | null;
    permissions: Permission[];
};

export type AssignUserRoleInput = {
    role: UserRoleName;
    eventId?: string | null;
    storeId?: string | null;
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
};

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

export type EventTicketItem = {
    id: string;
    eventId: string;
    name: string;
    description: string | null;
    price: string;
    quota: number;
    sold: number;
    minTicketQTY: number;
    maxTicketQTY: number;
    sortOrder: number;
    isActive: boolean;
    includesSouvenir: boolean;
    requiredFields: AttendeeField[];
    createdAt: string;
    updatedAt: string;
};

export type EventTicketInput = {
    name: string;
    description?: string | null;
    price: string;
    quota: number;
    minTicketQTY?: number;
    maxTicketQTY?: number;
    sortOrder?: number;
    isActive?: boolean;
    includesSouvenir?: boolean;
    requiredFields?: AttendeeField[];
};

export type OrderShippingDetail = {
    id: string;
    orderId: string;
    recipientName: string;
    recipientPhone: string;
    addressLine: string;
    subDistrict: string;
    district: string;
    province: string;
    postalCode: string;
    note: string | null;
    status: ShippingStatus;
    carrier: string | null;
    trackingNumber: string | null;
    shippedAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type OrderShippingInput = {
    recipientName: string;
    recipientPhone: string;
    addressLine: string;
    subDistrict: string;
    district: string;
    province: string;
    postalCode: string;
    note?: string | null;
};

export type TicketAttendeeInput = {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    email?: string | null;
    graduationYear?: string | null;
    receiveSouvenir?: boolean;
    souvenirSize?: string | null;
};

export type TicketItem = {
    id: string;
    orderId: string;
    eventId: string;
    eventTicketId: string;
    userId: string;
    unitPrice: string;
    ticketCode: string;
    qrToken: string;
    status: TicketStatus;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    email: string | null;
    graduationYear: string | null;
    checkedInAt: string | null;
    checkedInById: string | null;
    receiveSouvenir: boolean;
    souvenirSize: string | null;
    souvenirClaimedAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type OrderDetail = {
    id: string;
    orderNo: string;
    userId: string;
    eventId: string;
    total: string;
    status: OrderStatus;
    paymentSlip: string | null;
    paidAt: string | null;
    deliveryMethod: DeliveryMethod;
    shippingFee: string;
    shipping: OrderShippingDetail | null;
    tickets: TicketItem[];
    createdAt: string;
    updatedAt: string;
};

export type CreateOrderInput = {
    eventId: string;
    eventTicketId: string;
    quantity: number;
    deliveryMethod: DeliveryMethod;
    paymentSlip?: string | null;
    attendees: TicketAttendeeInput[];
    shipping?: OrderShippingInput | null;
};

export type ScanTicketInput = {
    qrToken: string;
};

export type ProductItem = {
    id: string;
    storeId: string;
    title: string;
    description: string;
    price: string;
    images: string[];
    createdAt: string;
    updatedAt: string;
};

export type ProductInput = {
    title: string;
    description: string;
    price: string;
    images?: string[];
};

export type StoreDetail = {
    id: string;
    eventId: string;
    name: string;
    description: string | null;
    banner: string | null;
    thumbnail: string | null;
    product: ProductItem | null;
    walletBalance: string;
    createdAt: string;
    updatedAt: string;
};

export type StoreInput = {
    eventId: string;
    name: string;
    description?: string | null;
    banner?: string | null;
    thumbnail?: string | null;
};

export type StoreSellInput = {
    customerUserId: string;
    amount: string;
    note?: string | null;
};

export type WalletHistoryItem = {
    id: string;
    walletId: string;
    type: TransactionType;
    status: TransactionStatus;
    amount: string;
    before: string;
    after: string;
    ref: string | null;
    note: string | null;
    createdAt: string;
};

export type WalletDetail = {
    id: string;
    userId: string | null;
    storeId: string | null;
    total: string;
    histories: WalletHistoryItem[];
    createdAt: string;
    updatedAt: string;
};

export type WalletTransactionInput = {
    userId: string;
    amount: string;
    note?: string | null;
};

export type OverviewReport = {
    totalTicketsSold: number;
    totalCheckedIn: number;
    totalTicketRevenue: string;
    totalStoreVolume: string;
};