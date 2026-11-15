import { CheckoutPanel, money, orderDate } from "@/components/checkout/checkout-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrderDetail } from "@/lib/api-types";
import { requirePageUser } from "@/server/auth/page-user";
import { getEvents } from "@/server/services/event.service";
import { getMyOrders } from "@/server/services/order.service";
import { ReceiptText } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

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

type Props = { searchParams: Promise<{ status?: string | string[] }> };

export default function OrdersPage(props: Props) {
    return <Suspense fallback={<Skeleton aria-label="กำลังโหลดประวัติคำสั่งซื้อ" className="h-60 w-full" />}>
        <OrdersContent {...props} />
    </Suspense>;
}

async function OrdersContent({ searchParams }: Props) {
    const { status } = await searchParams;
    const filter = filters.find((item) => item.value === status)?.value ?? "";
    const user = await requirePageUser(filter ? `/account/orders?status=${filter}` : "/account/orders");
    const [orders, events] = await Promise.all([getMyOrders(user.id), getEvents()]);
    const visibleOrders = filter ? orders.filter((order) => order.status === filter) : orders;
    const eventTitles = new Map(events.map((event) => [event.id, event.title]));
    return (
        <div className="space-y-5">
            <header className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight">ประวัติคำสั่งซื้อ</h1>
                <p className="text-sm text-muted-foreground">ดูรายการซื้อบัตร สถานะการจ่ายเงิน และของที่ระลึกของคุณ</p>
            </header>
            <nav aria-label="กรองสถานะคำสั่งซื้อ" className="flex flex-wrap gap-2">
                {filters.map(({ value, label }) => <Link key={value} href={value ? `/account/orders?status=${value}` : "/account/orders"}
                    aria-current={filter === value ? "page" : undefined}
                    className={cn("inline-flex min-h-10 items-center rounded-lg border px-3 text-sm focus-visible:ring-2 focus-visible:ring-brand", filter === value ? "border-brand/30 bg-brand-soft font-medium text-brand" : "hover:bg-muted")}>
                    {label}
                </Link>)}
            </nav>
            {!visibleOrders.length && <CheckoutPanel title={filter ? "ไม่มีคำสั่งซื้อในสถานะนี้" : "ยังไม่มีคำสั่งซื้อ"}>
                {filter ? <Button asChild variant="outline"><Link href="/account/orders">ดูคำสั่งซื้อทั้งหมด</Link></Button> : <>
                    <p className="text-sm text-muted-foreground">เลือกงานและซื้อบัตร แล้วกลับมาดูรายการได้ที่นี่</p>
                    <Button asChild variant="brand" className="h-11"><Link href="/events">ดูงานทั้งหมด</Link></Button>
                </>}
            </CheckoutPanel>}
            {visibleOrders.map((order) => (
                <CheckoutPanel key={order.id} title={eventTitles.get(order.eventId) ?? "งานที่สั่งซื้อ"}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground"><ReceiptText className="size-4 shrink-0" aria-hidden="true" /><span className="wrap-anywhere">{order.orderNo}</span></p>
                        <Badge variant="secondary" className={order.status === "PAID" ? "bg-brand-soft text-brand" : undefined}>{orderStatus(order)}</Badge>
                    </div>
                    <dl className="grid grid-cols-2 gap-3 border-t pt-4 text-sm sm:grid-cols-3">
                        <div><dt className="text-muted-foreground">สั่งซื้อเมื่อ</dt><dd>{orderDate(order.createdAt)}</dd></div>
                        <div><dt className="text-muted-foreground">จำนวนบัตร</dt><dd>{order.tickets.length} ใบ</dd></div>
                        <div><dt className="text-muted-foreground">ยอดรวม</dt><dd className="font-semibold tabular-nums">{money(order.total)}</dd></div>
                    </dl>
                    {order.tickets.length > 0 && <ul className="space-y-1 text-sm">
                        {order.tickets.map((ticket) => <li key={ticket.id} className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                            <span className="wrap-anywhere">{ticket.ticketTypeName ?? "บัตรเข้างาน"}{ticket.firstName ? ` · ${ticket.firstName} ${ticket.lastName ?? ""}` : ""}</span>
                            <span className="tabular-nums">{money(ticket.unitPrice)}</span>
                        </li>)}
                    </ul>}
                    {order.souvenirItems.length > 0 && <ul className="space-y-1 text-sm">
                        {order.souvenirItems.map((item) => <li key={item.size}>ของที่ระลึกเพิ่ม · {item.size} × {item.quantity} · {money(Number(item.unitPrice) * item.quantity)}</li>)}
                    </ul>}
                    {order.deliveryMethod !== "NONE" && <p className="text-sm text-muted-foreground">
                        ของที่ระลึก · {order.shipping ? `จัดส่งถึง ${order.shipping.recipientName}` : "รับที่งาน"}
                        {order.shipping?.trackingNumber ? ` · เลขติดตาม ${order.shipping.trackingNumber}` : ""}
                    </p>}
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant={order.status === "PENDING" && !order.hasPaymentSlip ? "brand" : "outline"} className="h-10">
                            <Link href={`/checkout/${order.id}`}>{order.status === "PENDING" && !order.hasPaymentSlip ? "ชำระเงินต่อ" : "ดูรายละเอียด"}</Link>
                        </Button>
                        {order.status === "PAID" && <Button asChild variant="brand" className="h-10"><Link href={`/account/tickets?order=${order.id}`}>ดู QR บัตร</Link></Button>}
                    </div>
                </CheckoutPanel>
            ))}
        </div>
    );
}
