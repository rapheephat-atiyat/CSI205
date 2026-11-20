import type {
    AdminActivityItem, AdminExportReport, AdminOrderDetail, AdminOrderFilters, AdminOrderSummary,
    AdminStore, AdminStoreCreateInput, AdminUser, EventOverviewReport, OrderReviewInput, OrderShippingUpdate, Paginated,
    ApiResponse,
    AssignUserRoleInput,
    CreateOrderInput,
    EventDetail,
    EventInput,
    EventSouvenirInput,
    EventSouvenirItem,
    EventSummary,
    EventTicketInput,
    EventTicketItem,
    FaqCategoryAdminItem,
    FaqCategoryInput,
    FaqCategoryItem,
    FaqQuestionAdminItem,
    FaqQuestionInput,
    OrderDetail,
    OverviewReport,
    ProductInput,
    ScanTicketInput,
    StaffAttendeeItem,
    StaffOverviewData,
    StaffTopUpInput,
    StoreDetail,
    StoreInput,
    StoreSaleResult,
    StoreSellInput,
    TicketItem,
    TokenRate,
    User as Profile,
    UserInput,
    UpdateFaqCategoryInput,
    UpdateFaqQuestionInput,
    WalletDetail,
    WalletHistoryItem,
    WalletTransactionInput,
} from "@/lib/api-types";
import type { Permission } from "@/lib/permissions";

async function request<T>(path: string, method = "GET", body?: unknown): Promise<ApiResponse<T>> {
    let response: Response;
    try {
        const baseUrl = process.env.APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
        const url = typeof window === "undefined" ? new URL(path, baseUrl).toString() : path;
        response = await fetch(url, {
            method,
            headers: body === undefined ? undefined : { "Content-Type": "application/json" },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch {
        return { success: false, error: { code: "NETWORK_ERROR", message: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่" } };
    }

    const result = await response.json().catch(() => null) as ApiResponse<T> | null;
    if (result?.success === true || result?.success === false) return result;

    return { success: false, error: { code: "INTERNAL_ERROR", message: "เซิร์ฟเวอร์ตอบข้อมูลไม่ถูกต้อง กรุณาลองใหม่" } };
}

function eventPath(eventId: string) {
    return `/api/admin/events/${encodeURIComponent(eventId)}`;
}

function orderPath(orderId: string) {
    return `/api/orders/${encodeURIComponent(orderId)}`;
}

function adminOrderPath(eventId: string, orderId: string) {
    return `${eventPath(eventId)}/orders/${encodeURIComponent(orderId)}`;
}

function withStoreId(path: string, storeId?: string) {
    return storeId ? `${path}?storeId=${encodeURIComponent(storeId)}` : path;
}


export const api = {
    faq: {
        /** อ่านเฉพาะหมวดและคำถามที่เผยแพร่แล้ว ไม่ต้องเข้าสู่ระบบ */
        list: () => request<FaqCategoryItem[]>("/api/faq"),
    },
    me: {
        /**
         * อ่านโปรไฟล์ของบัญชีที่ล็อกอินอยู่
         * @returns โปรไฟล์ ยอดโทเคน และบทบาทของบัญชี
         */
        get: () => request<Profile>("/api/me"),

        /**
         * แก้โปรไฟล์ของบัญชีที่ล็อกอินอยู่
         * @param input ส่งเฉพาะช่องที่ต้องการแก้ เช่น name, username หรือ phone
         * @returns โปรไฟล์หลังบันทึก
         * @example await api.me.update({ name: "พิม ใจดี", phone: "0812345678" })
         */
        update: (input: UserInput) => request<Profile>("/api/me", "PATCH", input),

        /**
         * ดูบัตรทั้งหมดของบัญชีที่ล็อกอินอยู่
         * @returns บัตรแต่ละใบพร้อมสถานะและ QR ของบัตรที่พร้อมใช้
         */
        tickets: () => request<TicketItem[]>("/api/me/tickets"),

        /**
         * ดูกระเป๋าโทเคนของตัวเอง
         * @returns ยอดคงเหลือและประวัติเติม ซื้อ และคืนโทเคน
         */
        wallet: () => request<WalletDetail>("/api/me/wallet"),
    },

    events: {
        /**
         * ดูรายการงานทั้งหมดสำหรับหน้าเว็บ
         * @returns ข้อมูลย่อ เช่น ชื่อ รูป สถานที่ และช่วงขายบัตร
         */
        list: () => request<EventSummary[]>("/api/events"),

        /**
         * เปิดรายละเอียดงานด้วยชื่อที่อยู่ใน URL
         * @param slug เช่น "tuatua-reunion-2026"
         * @returns รายละเอียดงาน รวม venue ที่ใช้ร่วมกันทุกกิจกรรม กำหนดการ ประเภทบัตร ของที่ระลึก และร้านค้า
         */
        get: (slug: string) => request<EventDetail>(`/api/events/${encodeURIComponent(slug)}`),

        /**
         * ดูเฉพาะงานที่บัญชีนี้มีสิทธิ์แก้ไข
         * @returns รายการข้อมูลย่อของงานที่จัดการได้
         */
        listManageable: () => request<EventSummary[]>("/api/admin/events"),

        /**
         * อ่านรายละเอียดงานด้วย ID ตอนจัดการงาน
         * @param eventId ค่า id จากรายการงาน
         * @returns ข้อมูลเต็มของงาน รวมกำหนดการและประเภทบัตร
         */
        getById: (eventId: string) => request<EventDetail>(eventPath(eventId)),

        /**
         * สร้างงานพร้อมกำหนดการได้ในคำขอเดียว ต้องมีสิทธิ์สร้างงาน
         * @param input ข้อมูลงาน ส่ง buyAt และ buyEndAt เป็นวันเวลา ISO 8601
         * @returns งานที่สร้างพร้อม id และรายการรอบกิจกรรม
         */
        create: (input: EventInput) => request<EventDetail>("/api/admin/events", "POST", input),

        /**
         * แก้ข้อมูลงานโดยส่งเฉพาะช่องที่เปลี่ยน
         * @param eventId ค่า id ของงาน
         * @param input ถ้าส่ง sessions ให้ส่งรอบทั้งหมดที่ต้องการเก็บ พร้อม id ของรอบเดิม
         * @returns งานหลังแก้ไข
         * @example await api.events.update(eventId, { title: "คืนสู่เหย้า", description: "<h2>กิจกรรม</h2>" })
         */
        update: (eventId: string, input: Partial<EventInput>) => request<EventDetail>(eventPath(eventId), "PATCH", input),

        /**
         * ลบงานที่ยังไม่มีออเดอร์หรือร้านค้า ต้องมีสิทธิ์สร้างงาน
         * @param eventId ค่า id ของงาน
         * @returns { id } ของงานที่ลบ
         */
        drop: (eventId: string) => request<{ id: string }>(eventPath(eventId), "DELETE"),

        tickets: {
            /**
             * ดูประเภทบัตรทั้งหมดของงาน รวมที่ปิดขายแล้ว
             * @param eventId ค่า id ของงานที่มีสิทธิ์จัดการ
             * @returns ประเภทบัตรพร้อมราคา โควตา และช่องข้อมูลที่ต้องกรอก
             */
            list: (eventId: string) => request<EventTicketItem[]>(`${eventPath(eventId)}/tickets`),

            /**
             * ดูรายละเอียดประเภทบัตรหนึ่งแบบ
             * @param eventId ค่า id ของงาน
             * @param ticketTypeId ค่า id ของประเภทบัตร
             * @returns ราคา โควตา และการตั้งค่าของประเภทบัตร
             */
            get: (eventId: string, ticketTypeId: string) =>
                request<EventTicketItem>(`${eventPath(eventId)}/tickets/${encodeURIComponent(ticketTypeId)}`),

            /**
             * เพิ่มประเภทบัตรให้กับงาน
             * @param eventId ค่า id ของงาน
             * @param input ชื่อ ราคา จำนวนบัตร และช่องที่ผู้จองต้องกรอก
             * @returns ประเภทบัตรที่สร้างพร้อม id
             * @example await api.events.tickets.create(eventId, { name: "Regular", price: "500.00", quota: 100, maxTicketQTY: 4 })
             */
            create: (eventId: string, input: EventTicketInput) =>
                request<EventTicketItem>(`${eventPath(eventId)}/tickets`, "POST", input),

            /**
             * แก้ประเภทบัตร เช่น ปิดขายหรือเพิ่มโควตา
             * @param eventId ค่า id ของงาน
             * @param ticketTypeId ค่า id ของประเภทบัตร
             * @param input ส่งเฉพาะช่องที่ต้องการแก้ เช่น { isActive: false }
             * @returns ประเภทบัตรหลังแก้ไข
             */
            update: (eventId: string, ticketTypeId: string, input: Partial<EventTicketInput>) =>
                request<EventTicketItem>(`${eventPath(eventId)}/tickets/${encodeURIComponent(ticketTypeId)}`, "PATCH", input),

            /**
             * ลบประเภทบัตรที่ยังไม่มีประวัติจอง
             * @param eventId ค่า id ของงาน
             * @param ticketTypeId ค่า id ของประเภทบัตร
             * @returns { id } ของประเภทบัตรที่ลบ
             */
            drop: (eventId: string, ticketTypeId: string) =>
                request<{ id: string }>(`${eventPath(eventId)}/tickets/${encodeURIComponent(ticketTypeId)}`, "DELETE"),
        },

        souvenirs: {
            /**
             * ดูของที่ระลึกทั้งหมดของงานที่จัดการได้
             * @param eventId ค่า id ของงาน
             * @returns รายการของที่ระลึกพร้อมไซซ์ ราคาซื้อเพิ่ม และสิทธิ์ของบัตร
             */
            list: (eventId: string) => request<EventSouvenirItem[]>(`${eventPath(eventId)}/souvenirs`),

            /**
             * ดูของที่ระลึกทีละรายการ
             * @param eventId ค่า id ของงาน
             * @param souvenirId ค่า id ของของที่ระลึก
             * @returns รายละเอียดของที่ระลึกและประเภทบัตรที่มีสิทธิ์รับ
             */
            get: (eventId: string, souvenirId: string) =>
                request<EventSouvenirItem>(`${eventPath(eventId)}/souvenirs/${encodeURIComponent(souvenirId)}`),

            /**
             * เพิ่มของที่ระลึกและกำหนดประเภทบัตรที่รับได้
             * @param eventId ค่า id ของงาน
             * @param input ชื่อ ไซซ์ ราคาซื้อเพิ่ม และสิทธิ์ เช่น allTicketTypes หรือ eligibleTicketTypeIds
             * @returns รายการของที่ระลึกพร้อม id
             * @example await api.events.souvenirs.create(eventId, { name: "เสื้อ", sizes: ["M", "L"], extraPrice: "300.00", eligibleTicketTypeIds: [ticketTypeId] })
             */
            create: (eventId: string, input: EventSouvenirInput) =>
                request<EventSouvenirItem>(`${eventPath(eventId)}/souvenirs`, "POST", input),

            /**
             * แก้รายละเอียดหรือเปลี่ยนสิทธิ์รับของที่ระลึก
             * @param eventId ค่า id ของงาน
             * @param souvenirId ค่า id ของของที่ระลึก
             * @param input ส่งเฉพาะช่องที่เปลี่ยน ถ้าส่ง eligibleTicketTypeIds จะใช้รายการใหม่แทนของเดิม
             * @returns ของที่ระลึกหลังแก้ไข
             */
            update: (eventId: string, souvenirId: string, input: Partial<EventSouvenirInput>) =>
                request<EventSouvenirItem>(`${eventPath(eventId)}/souvenirs/${encodeURIComponent(souvenirId)}`, "PATCH", input),

            /**
             * เอาของที่ระลึกออกจากรายการของงาน
             * @param eventId ค่า id ของงาน
             * @param souvenirId ค่า id ของของที่ระลึก
             * @returns { id } ของรายการที่ลบ
             */
            drop: (eventId: string, souvenirId: string) =>
                request<{ id: string }>(`${eventPath(eventId)}/souvenirs/${encodeURIComponent(souvenirId)}`, "DELETE"),
        },
    },

    orders: {
        /**
         * ดูประวัติออเดอร์ของบัญชีนี้
         * @returns ออเดอร์พร้อมยอดรวมและสถานะ เรียงจากใหม่ไปเก่า
         */
        listMy: () => request<OrderDetail[]>("/api/orders"),

        /**
         * เปิดรายละเอียดออเดอร์ของตัวเองทีละใบ
         * @param orderId ค่า id จากออเดอร์ ไม่ใช่ orderNo ที่แสดงบนจอ
         * @returns ออเดอร์พร้อมบัตร ของที่ระลึก ที่อยู่ และสถานะส่งสลิป
         */
        getMy: (orderId: string) => request<OrderDetail>(orderPath(orderId)),

        /**
         * จองบัตรและคำนวณยอดจริงจากราคาที่เซิร์ฟเวอร์
         * @param input ส่ง requestId, eventId, items และวิธีรับของ ถ้าส่งออเดอร์เดิมซ้ำให้ใช้ requestId เดิม
         * @returns ออเดอร์พร้อมยอดและบัตร ยอด 0 บาทจะได้บัตรพร้อมใช้ทันที
         * @example
         * await api.orders.create({
         *   requestId: crypto.randomUUID(),
         *   eventId,
         *   items: [{ eventTicketId: ticketTypeId, quantity: 1, attendees: [{ firstName: "พิม", lastName: "ใจดี" }] }],
         *   deliveryMethod: "NONE",
         * })
         */
        create: (input: CreateOrderInput) => request<OrderDetail>("/api/orders", "POST", input),

        /**
         * ส่งหลักฐานการโอนสำหรับออเดอร์ที่ยังรอชำระ
         * @param orderId ค่า id ของออเดอร์
         * @param proof Data URL ของรูป PNG หรือ JPEG ขนาดไม่เกิน 2 MB
         * @returns ออเดอร์ที่ hasPaymentSlip เป็น true และรอตรวจสลิป
         */
        submitPayment: (orderId: string, proof: string) => request<OrderDetail>(orderPath(orderId), "PATCH", {
            action: "submit", proof,
        }),

        /**
         * ยกเลิกออเดอร์ที่ยังรอชำระและยังไม่ได้ส่งสลิป ระบบจะคืนโควตาบัตรให้
         * @param orderId ค่า id ของออเดอร์
         * @returns null เมื่อยกเลิกสำเร็จ
         */
        cancel: (orderId: string) => request<null>(orderPath(orderId), "PATCH", { action: "cancel" }),
    },

    tickets: {
        /**
         * เช็กอินจาก QR หรือรหัสของบัตร ต้องมีสิทธิ์สแกนในงานนั้น
         * @param input ส่ง { qrToken, action } ที่อ่านจากบัตร
         * @returns บัตรพร้อมสถานะ USED และเวลาเช็กอิน
         */
        scan: (input: ScanTicketInput) => request<TicketItem>("/api/tickets/scan", "POST", input),
    },

    staff: {
        /**
         * ข้อมูลภาพรวมงานและสถิติสำหรับเจ้าหน้าที่
         */
        overview: () => request<StaffOverviewData>("/api/staff/overview"),

        /**
         * รายชื่อผู้เข้าร่วมสำหรับเจ้าหน้าที่ พร้อมค้นหาและกรอง
         */
        attendees: (params?: { q?: string; status?: string }) => {
            const query = new URLSearchParams();
            if (params?.q) query.set("q", params.q);
            if (params?.status) query.set("status", params.status);
            const qs = query.toString();
            return request<StaffAttendeeItem[]>(`/api/staff/attendees${qs ? `?${qs}` : ""}`);
        },

        /**
         * เติม Token หน้างานโดยเจ้าหน้าที่
         */
        topUp: (input: StaffTopUpInput) =>
            request<{ name: string; ticketCode: string | null; amount: number; balance: number }>("/api/staff/top-up", "POST", input),
        tokenRate: () => request<TokenRate>("/api/staff/token-rate"),
    },

    store: {
        /**
         * ดูร้านที่บัญชีนี้ดูแล
         * @param storeId ระบุร้านเมื่อดูแลหลายร้าน ถ้าเว้นไว้จะได้ร้านที่ผูกไว้ร้านแรก
         * @returns ข้อมูลร้าน สินค้า และยอดโทเคนของร้าน
         */
        getMy: (storeId?: string) => request<StoreDetail>(withStoreId("/api/store", storeId)),

        /**
         * เปิดร้านในงาน พร้อมสร้างกระเป๋าโทเคน ต้องมีสิทธิ์แก้ไขงาน
         * @param input ชื่อร้านและ eventId ของงานที่ตั้งร้าน
         * @returns ร้านใหม่พร้อม id ใช้ id นี้ตอนกำหนดบทบาทให้ผู้ขาย
         * @example await api.store.create({ eventId, name: "ร้านข้าวไก่ย่าง" })
         */
        create: (input: StoreInput) => request<StoreDetail>("/api/store", "POST", input),

        /**
         * เพิ่มหรือแก้สินค้าประจำร้าน
         * @param input ชื่อสินค้า รายละเอียด ราคา และรูปถ้ามี
         * @param storeId ระบุร้านเมื่อดูแลหลายร้าน
         * @returns ข้อมูลร้านพร้อมสินค้าหลังบันทึก
         * @example await api.store.updateProduct({ title: "ข้าวไก่ย่าง", description: "พร้อมข้าวสวย", price: "85.00" })
         */
        updateProduct: (input: ProductInput, storeId?: string) =>
            request<StoreDetail>(withStoreId("/api/store", storeId), "PATCH", input),

        /**
         * หักโทเคนจากลูกค้าแล้วเพิ่มเข้าร้าน
         * @param input รหัสผู้ซื้อและยอดที่ต้องชำระ
         * @param storeId ระบุร้านเมื่อดูแลหลายร้าน
         * @returns storeBalance และ customerBalance หลังจ่าย
         * @example await api.store.sell({ customerUserId, amount: "85.00", note: "ข้าวไก่ย่าง" })
         */
        sell: (input: StoreSellInput, storeId?: string) =>
            request<StoreSaleResult>(withStoreId("/api/store/sell", storeId), "POST", input),
    },

    admin: {
        updateTokenRate: (input: TokenRate) => request<TokenRate>("/api/admin/wallet/rate", "PATCH", input),
        eventOverview: (eventId: string) => request<EventOverviewReport>(`${eventPath(eventId)}/overview`),
        activities: (eventId: string) => request<AdminActivityItem[]>(`${eventPath(eventId)}/activities`),
        exportReport: (eventId: string) => request<AdminExportReport>(`${eventPath(eventId)}/reports`),
        orders: {
            list: (eventId: string, filters: AdminOrderFilters = {}) => {
                const query = new URLSearchParams();
                for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== "") query.set(key, String(value));
                return request<Paginated<AdminOrderSummary>>(`${eventPath(eventId)}/orders?${query}`);
            },
            get: (eventId: string, orderId: string) => request<AdminOrderDetail>(adminOrderPath(eventId, orderId)),
            review: (eventId: string, orderId: string, input: OrderReviewInput) => request<AdminOrderDetail>(`${adminOrderPath(eventId, orderId)}/review`, "POST", input),
            shipping: (eventId: string, orderId: string, input: OrderShippingUpdate) => request<AdminOrderDetail>(`${adminOrderPath(eventId, orderId)}/shipping`, "PATCH", input),
            slipUrl: (eventId: string, orderId: string) => `${adminOrderPath(eventId, orderId)}/slip`,
        },
        stores: {
            list: (eventId: string) => request<AdminStore[]>(`${eventPath(eventId)}/stores`),
            create: (eventId: string, input: AdminStoreCreateInput) => request<StoreDetail>(`${eventPath(eventId)}/stores`, "POST", input),
            update: (eventId: string, storeId: string, input: Partial<StoreInput>) => request<AdminStore>(`${eventPath(eventId)}/stores/${encodeURIComponent(storeId)}`, "PATCH", input),
            delete: (eventId: string, storeId: string) => request<{ id: string }>(`${eventPath(eventId)}/stores/${encodeURIComponent(storeId)}`, "DELETE"),
        },
        eventUsers: {
            list: (eventId: string, query = "") => request<AdminUser[]>(`${eventPath(eventId)}/users?query=${encodeURIComponent(query)}`),
            assignRole: (eventId: string, userId: string, input: AssignUserRoleInput) => request<{ id: string }>(`${eventPath(eventId)}/users/${encodeURIComponent(userId)}/roles`, "POST", input),
            updateRole: (eventId: string, userId: string, roleId: string, permissions: Permission[]) => request<{ id: string }>(`${eventPath(eventId)}/users/${encodeURIComponent(userId)}/roles/${encodeURIComponent(roleId)}`, "PATCH", { permissions }),
            revokeRole: (eventId: string, userId: string, roleId: string) => request<{ id: string }>(`${eventPath(eventId)}/users/${encodeURIComponent(userId)}/roles/${encodeURIComponent(roleId)}`, "DELETE"),
        },
        /** ทุกเมธอดต้องใช้บัญชี ADMIN ระดับระบบ */
        faq: {
            list: () => request<FaqCategoryAdminItem[]>("/api/admin/faq"),
            categories: {
                get: (id: string) => request<FaqCategoryAdminItem>(`/api/admin/faq/categories/${encodeURIComponent(id)}`),
                create: (input: FaqCategoryInput) => request<FaqCategoryAdminItem>("/api/admin/faq/categories", "POST", input),
                update: (id: string, input: UpdateFaqCategoryInput) => request<FaqCategoryAdminItem>(`/api/admin/faq/categories/${encodeURIComponent(id)}`, "PATCH", input),
                delete: (id: string) => request<{ id: string }>(`/api/admin/faq/categories/${encodeURIComponent(id)}`, "DELETE"),
            },
            questions: {
                get: (id: string) => request<FaqQuestionAdminItem>(`/api/admin/faq/questions/${encodeURIComponent(id)}`),
                create: (input: FaqQuestionInput) => request<FaqQuestionAdminItem>("/api/admin/faq/questions", "POST", input),
                update: (id: string, input: UpdateFaqQuestionInput) => request<FaqQuestionAdminItem>(`/api/admin/faq/questions/${encodeURIComponent(id)}`, "PATCH", input),
                delete: (id: string) => request<{ id: string }>(`/api/admin/faq/questions/${encodeURIComponent(id)}`, "DELETE"),
            },
        },
        users: {
            /**
             * ดูผู้ใช้ทั้งหมด ต้องมีสิทธิ์จัดการบทบาท
             * @returns รายชื่อพร้อมบทบาทและยอดโทเคน
             */
            list: () => request<Profile[]>("/api/admin/users"),

            /**
             * เพิ่มบทบาทและสิทธิ์ให้บัญชีผู้ใช้
             * @param userId ค่า id ของผู้ใช้จากรายชื่อ
             * @param input บทบาท สิทธิ์ และ eventId หรือ storeId ถ้าจำกัดขอบเขต
             * @returns โปรไฟล์ผู้ใช้พร้อมบทบาทที่เพิ่ม
             * @example await api.admin.users.assignRole(userId, { role: "STAFF", eventId, permissions: ["ticket.scan"] })
             */
            assignRole: (userId: string, input: AssignUserRoleInput) =>
                request<Profile>(`/api/admin/users/${encodeURIComponent(userId)}/roles`, "POST", input),
        },

        wallet: {
            /**
             * เติมโทเคนให้ผู้ใช้จากเคาน์เตอร์
             * @param input userId, amount และ note ถ้ามี
             * @returns กระเป๋าของผู้ใช้หลังเติมพร้อมประวัติรายการ
             * @example await api.admin.wallet.topup({ userId, amount: "500.00" })
             */
            topup: (input: WalletTransactionInput) => request<WalletDetail>("/api/admin/wallet/topup", "POST", input),

            /**
             * คืนโทเคนให้ผู้ใช้โดยหักยอดที่แลกคืนออกจากกระเป๋า
             * @param input userId, amount และ note ถ้ามี
             * @returns กระเป๋าของผู้ใช้พร้อมยอดที่ลดลงและประวัติรายการ
             * @example await api.admin.wallet.refund({ userId, amount: "100.00" })
             */
            refund: (input: WalletTransactionInput) => request<WalletDetail>("/api/admin/wallet/refund", "POST", input),
        },

        reports: {
            /**
             * ดูตัวเลขภาพรวม ต้องมีสิทธิ์อ่านรายงาน
             * @returns จำนวนบัตรที่ถูกจอง จำนวนเช็กอิน ยอดออเดอร์ที่ชำระแล้ว และยอดร้านค้า
             */
            overview: () => request<OverviewReport>("/api/admin/reports/overview"),

            /**
             * ดูรายการเคลื่อนไหวของกระเป๋าโทเคนล่าสุด
             * @returns ประวัติล่าสุดสูงสุด 100 รายการ เรียงจากใหม่ไปเก่า
             */
            auditLog: () => request<WalletHistoryItem[]>("/api/admin/reports/audit-log"),
        },
    },
};
