"use client";
import { BookCard, money, orderDate } from "@/components/book/BookUI";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventSummary, OrderDetail } from "@/lib/api-types";
import { souvenirVariantKey } from "@/lib/souvenirs";
import { cn } from "cn";
import { CloudOff, ReceiptText } from "lucide-react";
import Link from "next/link";

const filters = [
    { value: "", label: "ทั้งหมด" },
    { value: "PENDING", label: "รอชำระ / รอตรวจ" },
    { value: "PAID", label: "ชำระแล้ว" },
    { value: "CANCELLED", label: "ยกเลิกแล้ว" },
];


const orderStatus = (order: OrderDetail) => {
    if (order.status === "PAID") return "ชำระแล้ว";
    if (order.status === "CANCELLED") return "ยกเลิกแล้ว";
    return order.hasPaymentSlip || order.paymentSlip ? "รอตรวจสอบ" : "รอชำระเงิน";
};

export default function Content({ filter, orders, events }: { filter: string, orders: OrderDetail[], events: EventSummary[] }) {

    const visibleOrders = filter ? orders.filter((or) => or.status == filter) : orders;
    const eventsById = new Map(events.map((event) => [event.id, event]));



    return (
        <div className="space-y-5">
            <header className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight">ประวัติการสั่งซื้อ</h1>
                <p className="text-sm text-muted-foreground">ดูรายการซื้อบัตร สถานะการจ่ายเงิน และของที่ระลึกของคุณ</p>
            </header>
            <nav className="flex flex-wrap gap-2">
                {filters.map(({ value, label }) =>
                    <Link key={value} href={value ? `/account/orders?status=${value}` : "/account/orders"}
                        aria-current={filter === value ? "page" : undefined}
                        className={cn("inline-flex min-h-10 items-center rounded-lg border px-3 text-sm focus-visible:ring-2 focus-visible:ring-brand", filter === value ? "border-brand/30 bg-brand-soft font-medium text-brand" : "hover:bg-muted")}>
                        {label}
                    </Link>
                )}
            </nav>
            {!visibleOrders.length && (
                <section className="flex flex-col items-center rounded-xl border border-dashed bg-muted/30 px-4 py-10 text-center">
                    <CloudOff className="mb-4 size-15 text-muted-foreground/70" aria-hidden="true" />

                    <h2 className="text-base font-semibold">
                        {filter ? "ไม่มีคำสั่งซื้อ" : "ยังไม่มีคำสั่งซื้อ"}
                    </h2>

                    {!filter && (
                        <p className="mt-2 max-w-sm text-pretty text-sm text-muted-foreground">
                            เลือกงานแล้วซื้อบัตร คำสั่งซื้อของคุณจะแสดงที่นี่
                        </p>
                    )}

                    <Button asChild variant={filter ? "outline" : "brand"} className="mt-6 h-11 px-4">
                        <Link href={filter ? "/account/orders" : "/events"}>
                            {filter ? "ดูคำสั่งซื้อทั้งหมด" : "ดูงานทั้งหมด"}
                        </Link>
                    </Button>
                </section>
            )}
            {visibleOrders.map((order) => {
                const event = eventsById.get(order.eventId);

                return (
                    <BookCard key={order.id} title={event?.title ?? "งานที่สั่งซื้อ"}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                                <ReceiptText className="size-4 shrink-0" aria-hidden="true" />
                                <span className="wrap-anywhere">{order.orderNo}</span></p>
                            <Badge variant="secondary" className={order.status === "PAID" ? "bg-brand-soft text-brand" : undefined}>{orderStatus(order)}</Badge>
                        </div>
                        <dl className="grid grid-cols-2 gap-3 border-t pt-4 text-sm sm:grid-cols-3">
                            <div>
                                <dt className="text-muted-foreground">สั่งซื้อเมื่อ</dt>
                                <dd>{orderDate(order.createdAt)}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">จำนวนบัตร</dt>
                                <dd>{order.tickets.length} ใบ</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">ยอดรวม</dt>
                                <dd className="font-semibold tabular-nums">{money(order.total)}</dd>
                            </div>
                        </dl>
                        {order.tickets.length > 0 && <ul className="space-y-1 text-sm">
                            {order.tickets.map((ticket) => <li key={ticket.id} className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                                <span className="wrap-anywhere">{ticket.ticketTypeName ?? "บัตรเข้างาน"}{ticket.firstName ? ` · ${ticket.firstName} ${ticket.lastName ?? ""}` : ""}</span>
                                <span className="tabular-nums">{money(ticket.unitPrice)}</span>
                            </li>)}
                        </ul>}
                        {order.souvenirItems.length > 0 && <ul className="space-y-1 text-sm">
                            {order.souvenirItems.map((item) => <li key={souvenirVariantKey(item.souvenirId, item.size)}>
                                {item.name}{item.size ? ` · ขนาด ${item.size}` : ""} × {item.quantity} · {money(Number(item.unitPrice) * item.quantity)}
                            </li>)}
                        </ul>}
                        {order.deliveryMethod !== "NONE" && <p className="text-sm text-muted-foreground">
                            ของที่ระลึก · {order.shipping ? `จัดส่งถึง ${order.shipping.recipientName}` : "รับที่งาน"}
                            {order.shipping?.trackingNumber ? ` · เลขติดตาม ${order.shipping.trackingNumber}` : ""}
                        </p>}
                        <div className="flex flex-wrap gap-2">
                            {event && <Button asChild variant={order.status === "PENDING" && !order.hasPaymentSlip ? "brand" : "outline"} className="h-10">
                                <Link href={`/e/${encodeURIComponent(event.slug)}/book/order/${encodeURIComponent(order.id)}`}>{order.status === "PENDING" && !order.hasPaymentSlip ? "ชำระเงินต่อ" : "ดูรายละเอียด"}</Link>
                            </Button>}
                            {order.status === "PAID" && <Button asChild variant="brand" className="h-10"><Link href={`/account/tickets?order=${order.id}`}>ดู QR บัตร</Link></Button>}
                        </div>
                    </BookCard>
                )
            })}
        </div >
    )
}
