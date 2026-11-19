
export const PERMISSIONS = {
    /** สิทธิ์สร้างงานเลี้ยงรุน*/
    EVENT_CREATE: "event.create",
    /** สิทธิ์แก้ไขงานเลี้ยงรุ่น */
    EVENT_UPDATE: "event.update",
    /** ตรวจและอนุมัติหลักฐานชำระค่าบัตรภายในงาน */
    ORDER_REVIEW: "order.review",

    /** สิทธิ์สแกนบัตรเข้างาน */
    TICKET_SCAN: "ticket.scan",
    
    /** สิทธิ์เติมเงินให้ user */
    TOKEN_TOPUP: "token.topup",
    /** สิทธิ์สามารถ action การขอเงินคืน user ได้ */
    TOKEN_REFUND_APPROVE: "token.refund.approve",

    /** สิทธิ์จัดการร้านค้า */
    STORE_MANAGE: "store.manage",
    /** สิทธิ์ขายของ */
    STORE_SELL: "store.sell",

    /** สิทธิ์ดูขอมูล Dashboard excel csv ต่างๆได้ */
    REPORT_READ: "report.read",
    /** สิทธิ์ส่งออกข้อมูล */
    REPORT_EXPORT: "report.export",

    /** สิทธิ์จัดการสิทธิ์ */
    PERMISSION_MANAGE: "permission.manage",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export const EVENT_ADMIN_PERMISSIONS: Permission[] = [
    PERMISSIONS.EVENT_UPDATE, PERMISSIONS.ORDER_REVIEW, PERMISSIONS.TICKET_SCAN,
    PERMISSIONS.STORE_MANAGE, PERMISSIONS.REPORT_READ, PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.PERMISSION_MANAGE,
];

export const PERMISSION_LABELS: Record<Permission, string> = {
    "event.create": "สร้างงาน", "event.update": "แก้ไขงาน บัตร และของที่ระลึก", "order.review": "ตรวจชำระเงินและจัดส่ง",
    "ticket.scan": "สแกนบัตรเข้างาน", "token.topup": "เติม Token", "token.refund.approve": "คืน Token",
    "store.manage": "จัดการร้านค้า", "store.sell": "ขายสินค้า", "report.read": "อ่านรายงานและประวัติ",
    "report.export": "ส่งออกรายงาน", "permission.manage": "จัดการบทบาทและสิทธิ์ในงาน",
};
