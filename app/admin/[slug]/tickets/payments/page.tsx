"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { AdminOrderFilters, AdminOrderSummary, Paginated } from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminAccess } from "@/components/admin/AdminAccess";
import { AdminFeedback, apiData } from "@/components/admin/AdminFeedback";
import OrderReviewDialog from "./OrderReviewDialog";

const filters = ["review", "all", "PENDING", "PAID", "CANCELLED"] as const;
type Filter = typeof filters[number];
const labels: Record<Filter, string> = { review: "รอตรวจสลิป", all: "ทุกสถานะ", PENDING: "รอชำระ / รอตรวจ", PAID: "ชำระแล้ว", CANCELLED: "ยกเลิกแล้ว" };

export default function PaymentsPage() {
    const { eventId, eventTitle } = useAdminAccess();
    const [filter, setFilter] = useState<Filter>("review");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [revision, setRevision] = useState(0);
    const [result, setResult] = useState<Paginated<AdminOrderSummary> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    function reload() { setLoading(true); setError(null); setRevision((value) => value + 1); }
    useEffect(() => {
        let cancelled = false;
        const timer = setTimeout(async () => {
            const options: AdminOrderFilters = { query, page, ...(filter === "review" ? { review: "pending" } : filter === "all" ? {} : { status: filter }) };
            try {
                const data = apiData(await api.admin.orders.list(eventId, options));
                if (!cancelled) { setResult(data); setError(null); }
            } catch (cause) {
                if (!cancelled) setError(cause instanceof Error ? cause.message : "โหลดคำสั่งซื้อไม่สำเร็จ");
            } finally { if (!cancelled) setLoading(false); }
        }, 200);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [eventId, query, filter, page, revision]);

    return <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
            <div><h1 className="text-2xl font-semibold">ตรวจชำระเงิน</h1><p className="mt-2 text-sm text-muted-foreground">{eventTitle} · ตรวจหลักฐานก่อนเปิดใช้บัตร</p></div>
            <Button variant="outline" className="min-h-11" onClick={reload}>รีเฟรชรายการ</Button>
        </header>
        <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2"><label htmlFor="order-search" className="text-sm font-medium">ค้นหาคำสั่งซื้อ</label><Input id="order-search" value={query} maxLength={100} placeholder="เลขคำสั่งซื้อ ชื่อ หรืออีเมล" onChange={(e) => { setQuery(e.target.value); setPage(1); setLoading(true); }} /></div>
            <div className="space-y-2 sm:w-56"><label htmlFor="order-status" className="text-sm font-medium">สถานะ</label><Select value={filter} onValueChange={(value) => { if (filters.includes(value as Filter)) { setFilter(value as Filter); setPage(1); setLoading(true); } }}><SelectTrigger id="order-status" className="w-full min-h-11"><SelectValue /></SelectTrigger><SelectContent>{filters.map((value) => <SelectItem key={value} value={value}>{labels[value]}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <AdminFeedback loading={loading} error={error} retry={reload} />
        {!loading && !error && result && <div className="rounded-xl border bg-background p-4">
            <p className="mb-4 text-sm text-muted-foreground">พบ {result.total.toLocaleString("th-TH")} คำสั่งซื้อ</p>
            <Table><TableHeader><TableRow><TableHead>คำสั่งซื้อ / ผู้ซื้อ</TableHead><TableHead>บัตร</TableHead><TableHead>ยอดรวม</TableHead><TableHead>สถานะ</TableHead><TableHead><span className="sr-only">จัดการ</span></TableHead></TableRow></TableHeader>
                <TableBody>{result.items.length === 0 ? <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">ไม่พบคำสั่งซื้อในตัวกรองนี้</TableCell></TableRow> : result.items.map((order) => <TableRow key={order.id}>
                    <TableCell><p className="font-medium">{order.orderNo}</p><p className="mt-1 text-sm text-muted-foreground">{order.buyerName} · {order.buyerEmail}</p></TableCell>
                    <TableCell className="tabular-nums">{order.ticketCount} ใบ</TableCell>
                    <TableCell className="tabular-nums">฿{Number(order.total).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{order.status === "PENDING" ? order.hasPaymentSlip ? "รอตรวจสลิป" : "รอชำระเงิน" : labels[order.status]}</TableCell>
                    <TableCell><Button variant="outline" className="min-h-11" onClick={() => setSelectedId(order.id)}>ดูคำสั่งซื้อ</Button></TableCell>
                </TableRow>)}</TableBody></Table>
            <div className="mt-4 flex flex-wrap items-center justify-end gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => { setPage(page - 1); setLoading(true); }}>ก่อนหน้า</Button><span className="text-sm tabular-nums">หน้า {page} / {Math.max(1, Math.ceil(result.total / result.pageSize))}</span><Button variant="outline" disabled={page * result.pageSize >= result.total} onClick={() => { setPage(page + 1); setLoading(true); }}>ถัดไป</Button></div>
        </div>}
        <OrderReviewDialog orderId={selectedId} onClose={() => setSelectedId(null)} onUpdated={() => { setSelectedId(null); reload(); toast.success("บันทึกผลการตรวจแล้ว"); }} />
    </div>;
}
