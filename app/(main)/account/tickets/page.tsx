import { BookCard } from "@/components/book/BookUI";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { TicketItem } from "@/lib/api-types";
import { cn } from "@/lib/utils";
import { requirePageUser } from "@/server/auth/page-user";
import { getEventsByIds } from "@/server/services/event.service";
import { getMyTickets } from "@/server/services/order.service";
import { CircleCheck, CircleX, Clock3, QrCode, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import QRCode from "qrcode";
import { Suspense } from "react";

const ticketStatuses: Record<TicketItem["status"], { label: string; message: string; icon: LucideIcon }> = {
    PENDING: { label: "รอยืนยันการชำระ", message: "QR จะแสดงเมื่อยืนยันการชำระ", icon: Clock3 },
    ACTIVE: { label: "พร้อมใช้", message: "QR ยังไม่พร้อมใช้งาน", icon: QrCode },
    USED: { label: "เช็กอินแล้ว", message: "บัตรนี้ใช้เข้างานแล้ว", icon: CircleCheck },
    CANCELLED: { label: "ยกเลิกแล้ว", message: "ยกเลิกสิทธิ์เข้างานแล้ว", icon: CircleX },
};

type Props = { searchParams: Promise<{ order?: string | string[] }> };

export default function MyTicketsPage(props: Props) {
    return <Suspense fallback={<Skeleton aria-label="กำลังโหลดบัตร" className="h-60 w-full" />}>
        <TicketsContent {...props} />
    </Suspense>;
}

async function TicketsContent({ searchParams }: Props) {
    const { order } = await searchParams;
    await connection();
    const user = await requirePageUser(typeof order === "string" ? `/account/tickets?order=${encodeURIComponent(order)}` : "/account/tickets");
    const tickets = await getMyTickets(user.id);
    const visibleTickets = tickets.filter((ticket) => typeof order !== "string" || ticket.orderId === order);
    const events = await getEventsByIds(visibleTickets.map((ticket) => ticket.eventId));
    const eventTitles = new Map(events.map((event) => [event.id, event.title]));
    const cards = await Promise.all(visibleTickets.map(async (ticket) => ({
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
            {!cards.length && <BookCard title="ยังไม่พบบัตร">
                <p className="text-sm text-muted-foreground">ตรวจสอบรายการของคุณได้จากประวัติคำสั่งซื้อ</p>
                <Button asChild variant="brand"><Link href="/account/orders">ดูประวัติคำสั่งซื้อ</Link></Button>
            </BookCard>}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map(({ ticket, qr }) => {
                    const { label, message, icon: StatusIcon } = ticketStatuses[ticket.status];
                    return (
                        <BookCard
                            key={ticket.id}
                            title={eventTitles.get(ticket.eventId) ?? "บัตรเข้างาน"}
                            className="grid gap-4 space-y-0 wrap-anywhere sm:supports-[grid-template-rows:subgrid]:row-span-4 sm:supports-[grid-template-rows:subgrid]:grid-rows-subgrid"
                        >
                            <Badge variant="secondary" className={cn("place-self-start", ticket.status === "ACTIVE" && "bg-brand-soft text-brand")}>
                                {label}
                            </Badge>
                            <div className={cn(
                                "relative mx-auto flex aspect-square w-full max-w-48 flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border",
                                qr ? "bg-white" : "border-dashed bg-muted px-4 text-center text-muted-foreground",
                            )}>
                                {qr ? (
                                    <Image src={qr} alt={`QR เข้างานสำหรับบัตร ${ticket.ticketCode}`} fill unoptimized sizes="192px" className="object-contain" />
                                ) : (
                                    <>
                                        <StatusIcon className="size-7 shrink-0" aria-hidden="true" />
                                        <p className="text-xs">{message}</p>
                                    </>
                                )}
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="space-y-1 text-sm">
                                    <p className="font-medium">{[ticket.firstName, ticket.lastName].filter(Boolean).join(" ") || "ผู้เข้าร่วมงาน"}</p>
                                    {ticket.ticketTypeName && <p className="text-muted-foreground">{ticket.ticketTypeName}</p>}
                                    <p className="text-xs text-muted-foreground">{ticket.ticketCode}</p>
                                    {ticket.tokenReward > 0 && ticket.status !== "CANCELLED" && (
                                        <p className="text-muted-foreground">
                                            {ticket.status === "PENDING" ? "รอรับ" : "ได้รับ"} {ticket.tokenReward.toLocaleString("th-TH")} Token
                                        </p>
                                    )}
                                    {ticket.souvenirItems.map(({ souvenirId, name, size }) => (
                                        <p key={souvenirId} className="text-muted-foreground">รับ {name}{size ? ` · ขนาด ${size}` : ""}</p>
                                    ))}
                                </div>
                                {qr && <Button asChild variant="outline" className="mt-auto h-10 w-full"><a href={qr} download={`${ticket.ticketCode}.png`}>บันทึก QR</a></Button>}
                            </div>
                        </BookCard>
                    );
                })}
            </div>
        </div>
    );
}
