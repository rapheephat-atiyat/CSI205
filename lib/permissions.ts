
export const PERMISSIONS = {
    /** สิทธิ์สร้างงานเลี้ยงรุน*/
    EVENT_CREATE: "event.create",
    /** สิทธิ์แก้ไขงานเลี้ยงรุ่น */
    EVENT_UPDATE: "event.update",

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

export type Permisson = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
