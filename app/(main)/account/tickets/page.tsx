import { CheckoutPanel } from "@/components/checkout/checkout-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { TicketItem } from "@/lib/api-types";
import { requirePageUser } from "@/server/auth/page-user";
import { getEvents } from "@/server/services/event.service";
import { getMyTickets } from "@/server/services/order.service";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { Suspense } from "react";

const labels: Record<TicketItem["status"], string> = {
    PENDING: "รอยืนยันการชำระ",
    ACTIVE: "พร้อมใช้",
    USED: "เช็กอินแล้ว",
    CANCELLED: "ยกเลิกแล้ว",
};

type Props = { searchParams: Promise<{ order?: string | string[] }> };

export default function MyTicketsPage(props: Props) {
    return <Suspense fallback={<Skeleton aria-label="กำลังโหลดบัตร" className="h-60 w-full" />}>
        <TicketsContent {...props} />
    </Suspense>;
}

async function TicketsContent({ searchParams }: Props) {
    const { order } = await searchParams;
    const user = await requirePageUser(typeof order === "string" ? `/account/tickets?order=${encodeURIComponent(order)}` : "/account/tickets");
    const [tickets, events] = await Promise.all([getMyTickets(user.id), getEvents()]);
    const eventTitles = new Map(events.map((event) => [event.id, event.title]));
    const cards = await Promise.all(tickets.filter((ticket) => typeof order !== "string" || ticket.orderId === order).map(async (ticket) => ({
        ticket,
        qr: ticket.status === "ACTIVE" && ticket.qrToken ? await QRCode.toDataURL(ticket.qrToken, { width: 320, margin: 4 }) : null,
    })));

    return (
        <div className="space-y-5">
            <header className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight">บัตรของฉัน</h1>
                <p className="text-sm text-muted-foreground">แสดง QR ของบัตรแต่ละใบที่จุดเช็กอินหลังยืนยันการชำระเงินแล้ว</p>
                {order && <Button asChild variant="outline"><Link href="/account/tickets">ดูบัตรทั้งหมด</Link></Button>}
            </header>
            {!cards.length && <CheckoutPanel title="ยังไม่พบบัตร">
                <p className="text-sm text-muted-foreground">ตรวจสอบรายการของคุณได้จากประวัติคำสั่งซื้อ</p>
                <Button asChild variant="brand"><Link href="/account/orders">ดูประวัติคำสั่งซื้อ</Link></Button>
            </CheckoutPanel>}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map(({ ticket, qr }) => (
                    <CheckoutPanel key={ticket.id} title={eventTitles.get(ticket.eventId) ?? "บัตรเข้างาน"}>
                        <Badge variant="secondary" className={ticket.status === "ACTIVE" ? "bg-brand-soft text-brand" : undefined}>{labels[ticket.status]}</Badge>
                        {qr && <Image src={qr} alt={`QR เข้างานสำหรับบัตร ${ticket.ticketCode}`} width={192} height={192} unoptimized className="mx-auto rounded-lg border bg-white" />}
                        <div className="space-y-1 text-sm">
                            <p className="font-medium wrap-anywhere">{[ticket.firstName, ticket.lastName].filter(Boolean).join(" ") || "ผู้เข้าร่วมงาน"}</p>
                            {ticket.ticketTypeName && <p className="text-muted-foreground wrap-anywhere">{ticket.ticketTypeName}</p>}
                            <p className="text-xs text-muted-foreground wrap-anywhere">{ticket.ticketCode}</p>
                            {ticket.receiveSouvenir && <p className="text-muted-foreground">รับของที่ระลึก{ticket.souvenirSize ? ` · ขนาด ${ticket.souvenirSize}` : ""}</p>}
                        </div>
                        {qr && <Button asChild variant="outline" className="h-10 w-full"><a href={qr} download={`${ticket.ticketCode}.png`}>บันทึก QR</a></Button>}
                    </CheckoutPanel>
                ))}
            </div>
        </div>
    );
}
