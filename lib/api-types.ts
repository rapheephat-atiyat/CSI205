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

export type AdminEventSummary = EventSummary & { archivedAt: string | null };
export type EventArchiveResult = Pick<AdminEventSummary, "id" | "archivedAt">;

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

export type EventDetail = AdminEventSummary & {
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
    tokenReward: number;
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
    tokenReward?: number;
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
    attendanceDate?: string | null;
    eventId: string;
    eventTicketId: string;
    ticketTypeName?: string;
    userId: string;
    unitPrice: string;
    ticketCode: string;
    tokenReward: number;
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
    attendanceDate: string | null;
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
    /** วันที่เข้าร่วมตามเวลาไทย (YYYY-MM-DD) ต้องเลือกเมื่อมีกำหนดการหลายวัน */
    attendanceDate?: string | null;
    items: OrderSelection[];
    deliveryMethod: DeliveryMethod;
    /** ต้องส่งที่อยู่เมื่อเลือก deliveryMethod เป็น "SHIPPING" */
    shipping?: OrderShippingInput | null;
    /** ของที่ซื้อเพิ่ม ของที่มากับบัตรให้เลือกใน attendees[].souvenirs */
    souvenirItems?: OrderSouvenirInput[];
};

export type ScanTicketInput = {
    qrToken: string;
    action?: "in" | "out";
};

export type StaffAttendeeItem = {
    id: string;
    name: string;
    ticketId: string;
    ticketType: string;
    status: "not-arrived" | "checked-in" | "checked-out";
    tokens: number;
    userId: string;
    lastActionAt?: string;
    phone?: string;
    email?: string;
};

export type StaffOverviewData = {
    total: number;
    checkedIn: number;
    checkedOut: number;
    waiting: number;
    eventInfo: {
        id?: string;
        name: string;
        date: string;
        capacity: number;
    };
    recentScans: {
        id: string;
        time: string;
        attendeeName: string;
        ticketId: string;
        action: "in" | "out";
        outcome: "checked-in" | "checked-out" | "expired" | "duplicate" | "invalid";
    }[];
    staffProfile?: {
        name: string;
        role: string;
        topUpQuotaTotal: number;
        topUpQuotaUsed: number;
    };
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

export type AdminStoreCreateInput = Omit<StoreInput, "eventId"> & {
    product?: Pick<ProductInput, "title" | "price" | "images">;
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
    bahtPerToken: string | null;
    bahtAmount: string | null;
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
    /** จำนวน Token ที่เติมหรือคืน เช่น "500.00" */
    amount: string;
    note?: string | null;
    expectedBahtPerToken?: string;
};

export type TokenRate = { bahtPerToken: string };

export type StaffTopUpInput = {
    attendeeId: string;
    amount: number;
    note?: string;
    expectedBahtPerToken?: string;
};

export type StoreSaleResult = {
    storeBalance: string;
    customerBalance: string;
};

export type StoreSalesSummary = {
    todaySales: number;
    todayTransactions: number;
    weeklySales: number;
    dailySales: { date: string; label: string; sales: number }[];
    recentTransactions: {
        id: string;
        customerName: string | null;
        amount: number;
        createdAt: string;
    }[];
};

export type OverviewReport = {
    totalTicketsSold: number;
    totalCheckedIn: number;
    totalTicketRevenue: string;
    totalStoreVolume: string;
};

export type OrderReviewInput = { decision: "APPROVE" | "REJECT"; reason?: string };
export type OrderShippingUpdate = { status: ShippingStatus; carrier?: string | null; trackingNumber?: string | null };
export type AdminOrderSummary = {
    id: string; orderNo: string; eventId: string; userId: string;
    buyerName: string; buyerEmail: string; total: string; status: OrderStatus;
    hasPaymentSlip: boolean; ticketCount: number; createdAt: string;
    reviewDecision: "APPROVE" | "REJECT" | null; reviewedAt: string | null;
};
export type AdminOrderDetail = OrderDetail & {
    buyer: { id: string; name: string; email: string; phone: string | null };
    review: { decision: "APPROVE" | "REJECT"; actorId: string | null; at: string; reason: string | null } | null;
};
export type Paginated<T> = { items: T[]; total: number; page: number; pageSize: number };
export type AdminOrderFilters = { status?: OrderStatus; review?: "pending"; query?: string; page?: number };
export type AdminUser = Pick<User, "id" | "name" | "email" | "graduationAt" | "status" | "roles">;
export type AdminStore = StoreDetail & { managers: { id: string; name: string; email: string }[] };
export type AdminActivityItem = {
    id: string; eventId: string | null; actorId: string | null; actorName: string | null;
    action: string; targetId: string; note: string | null; createdAt: string;
};
export type EventOverviewReport = OverviewReport & {
    paidOrders: number; pendingOrders: number; pendingTickets: number; pendingAmount: string;
    checkIns: { time: string; attendees: number }[];
};
export type AdminExportTicket = EventTicketItem & { paidTickets: number; paidRevenue: string };
export type AdminExportReport = { overview: EventOverviewReport; tickets: AdminExportTicket[]; stores: AdminStore[]; auditLog: WalletHistoryItem[] };


export type FaqQuestionItem = {
    id: string;
    question: string;
    answer: string;
    keywords: string[];
    linkLabel: string | null;
    linkHref: string | null;
};

export type FaqCategoryItem = {
    id: string;
    name: string;
    icon: string;
    questions: FaqQuestionItem[];
};

export type FaqCategoryInput = {
    name: string;
    icon: string;
    sortOrder?: number;
    isPublished?: boolean;
};

export type FaqQuestionInput = {
    categoryId: string;
    question: string;
    answer: string;
    keywords?: string[];
    linkLabel?: string | null;
    linkHref?: string | null;
    sortOrder?: number;
    isPublished?: boolean;
};

export type UpdateFaqCategoryInput = Partial<FaqCategoryInput>;
export type UpdateFaqQuestionInput = Partial<FaqQuestionInput>;

export type FaqQuestionAdminItem = FaqQuestionItem & {
    categoryId: string;
    sortOrder: number;
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
};

export type FaqCategoryAdminItem = Omit<FaqCategoryItem, "questions"> & {
    sortOrder: number;
    isPublished: boolean;
    questions: FaqQuestionAdminItem[];
    createdAt: string;
    updatedAt: string;
};
