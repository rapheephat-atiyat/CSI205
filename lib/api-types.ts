import { type Permission } from "@/lib/permissions";
import { AttendeeField, DeliveryMethod, OrderStatus, ShippingStatus, TicketStatus, TransactionStatus, TransactionType } from "@/server/database/enums/domain.enum";

export type ApiError = { code: string, message: string };
export type ApiSuccess<T> = { success: true, data: T };
export type ApiFailure = { success: false, error: ApiError };

/** ถ้า success เป็น true ให้อ่าน data ถ้าเป็น false ให้อ่าน error.message */
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type UserRoleName = "ADMIN" | "VENDOR" | "STAFF" | "USER";

export type EventSummary = {
    id: string;
    slug: string;
    title: string;
    subTitle: string;
    thumbnail: string;
    /** สถานที่จัดงานที่ใช้ร่วมกันทุกกิจกรรม */
    venue: string;
    tags: string[];
    buyAt: string;
    buyEndAt: string;
};

export type EventSouvenirItem = {
    id: string;
    name: string;
    image: string | null;
    sizes: string[];
    extraPrice: string | null;
    allowDecline: boolean;
    allTicketTypes: boolean;
    eligibleTicketTypeIds: string[];
};

export type EventSouvenirInput = {
    name: string;
    image?: string | null;
    /** ไซซ์ที่เลือกได้ เช่น ["S", "M", "L"] หรือ [] ถ้าไม่มีไซซ์ */
    sizes?: string[];
    /** ราคาซื้อเพิ่มเป็นบาท เช่น "179.50" ใช้ null ถ้าไม่เปิดขายเพิ่ม */
    extraPrice?: string | null;
    /** ตั้งเป็น false ถ้าเป็นของที่รวมกับบัตรและผู้จองขอไม่รับไม่ได้ */
    allowDecline?: boolean;
    /** ตั้ง true เมื่อบัตรทุกประเภทในงานรับได้ */
    allTicketTypes?: boolean;
    /** ID ประเภทบัตรที่รับได้ เมื่อไม่ได้ให้ทุกประเภท */
    eligibleTicketTypeIds?: string[];
};

export type EventSessionItem = {
    id: string;
    title: string;
    description: string | null;
    startsAt: string | null;
    endsAt: string | null;
};

export type EventSessionInput = {
    /** ใส่ id เดิมเพื่อแก้รอบ หรือเว้นไว้เมื่อต้องการเพิ่ม */
    id?: string;
    title: string;
    description?: string | null;
    /** วันและเวลา ISO 8601 เช่น "2026-12-12T16:30:00+07:00" */
    startsAt?: string | null;
    endsAt?: string | null;
};

export type EventDetail = EventSummary & {
    souvenirs: EventSouvenirItem[];
    banner: string;
    description: string;
    minTicketQTY: number;
    maxTicketQTY: number;
    allowShipping: boolean;
    shippingFee: string;
    sessions: EventSessionItem[];
    stores: {
        id: string;
        name: string;
        description: string | null;
        thumbnail: string | null;
    }[];
    tickets: EventTicketItem[];
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
    /** เนื้อหางานเป็นข้อความหรือ HTML Rich Text */
    description: string;
    tags: string[];
    buyAt: string;
    buyEndAt: string;
    minTicketQTY: number;
    maxTicketQTY: number;
    allowShipping?: boolean;
    shippingFee?: string;
    /** เว้นไว้เพื่อคงกำหนดการเดิม หรือส่งรายการรอบทั้งหมดที่ต้องการเก็บ */
    sessions?: EventSessionInput[];
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
    requiredFields: AttendeeField[];
    createdAt: string;
    updatedAt: string;
};

export type EventTicketInput = {
    name: string;
    description?: string | null;
    /** ราคาเป็นบาท เช่น "500.00" หรือ "0.00" สำหรับบัตรฟรี */
    price: string;
    quota: number;
    minTicketQTY?: number;
    maxTicketQTY?: number;
    sortOrder?: number;
    isActive?: boolean;
    /** ช่องที่ผู้จองต้องกรอก เช่น ["firstName", "lastName"] */
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
    souvenirs?: SouvenirSelection[];
};

export type SouvenirSelection = { souvenirId: string; size: string | null };
export type TicketSouvenir = SouvenirSelection & { name: string; claimedAt?: string | null };

export type TicketItem = {
    id: string;
    orderId: string;
    eventId: string;
    eventTicketId: string;
    ticketTypeName?: string;
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
    souvenirItems: TicketSouvenir[];
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
    hasPaymentSlip: boolean;
    paymentDueAt?: string;
    paidAt: string | null;
    deliveryMethod: DeliveryMethod;
    shippingFee: string;
    souvenirItems: OrderSouvenirItem[];
    shipping: OrderShippingDetail | null;
    tickets: TicketItem[];
    createdAt: string;
    updatedAt: string;
};

export type OrderSouvenirInput = { souvenirId: string; size: string | null; quantity: number };
export type OrderSouvenirItem = OrderSouvenirInput & { name: string; unitPrice: string };

type OrderSelection = {
    /** id ของประเภทบัตรจาก event.tickets */
    eventTicketId: string;
    quantity: number;
    /** ข้อมูลผู้ร่วมงานหนึ่งคนต่อบัตรหนึ่งใบ */
    attendees: TicketAttendeeInput[];
};

export type CreateOrderInput = {
    /** สร้างด้วย crypto.randomUUID() แล้วใช้ค่าเดิมถ้าต้องลองส่งออเดอร์เดิมอีกครั้ง */
    requestId: string;
    eventId: string;
    items: OrderSelection[];
    deliveryMethod: DeliveryMethod;
    /** ต้องส่งที่อยู่เมื่อเลือก deliveryMethod เป็น "SHIPPING" */
    shipping?: OrderShippingInput | null;
    /** ของที่ซื้อเพิ่ม ของที่มากับบัตรให้เลือกใน attendees[].souvenirs */
    souvenirItems?: OrderSouvenirInput[];
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
    /** id ของบัญชีผู้ซื้อที่อ่านได้จากข้อมูลผู้ใช้ */
    customerUserId: string;
    /** ยอดที่หักจากกระเป๋าผู้ซื้อ เช่น "85.00" */
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
    /** id ของบัญชีเจ้าของกระเป๋า */
    userId: string;
    /** ยอดที่เติมหรือคืน เช่น "500.00" */
    amount: string;
    note?: string | null;
};

export type StoreSaleResult = {
    storeBalance: string;
    customerBalance: string;
};

export type OverviewReport = {
    totalTicketsSold: number;
    totalCheckedIn: number;
    totalTicketRevenue: string;
    totalStoreVolume: string;
};
