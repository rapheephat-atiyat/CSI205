"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { AdminOrderDetail, OrderReviewInput } from "@/lib/api-types";
import { useAdminAccess } from "@/components/admin/AdminAccess";
import { AdminFeedback, apiData } from "@/components/admin/AdminFeedback";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ShippingForm from "./ShippingForm";

const money = (value: string) => Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2 });

export default function OrderReviewDialog({ orderId, onClose, onUpdated }: { orderId: string | null; onClose: () => void; onUpdated: () => void }) {
    return <Dialog open={orderId !== null} onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader><DialogTitle>รายละเอียดคำสั่งซื้อ</DialogTitle><DialogDescription>ตรวจยอดและหลักฐานชำระเงินก่อนยืนยัน ผลการตรวจจะเปิดใช้หรือยกเลิกบัตรจริง</DialogDescription></DialogHeader>
        {orderId && <OrderContent key={orderId} orderId={orderId} onUpdated={onUpdated} />}
    </DialogContent></Dialog>;
}

function OrderContent({ orderId, onUpdated }: { orderId: string; onUpdated: () => void }) {
    const { eventId } = useAdminAccess();
    const [order, setOrder] = useState<AdminOrderDetail | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [revision, setRevision] = useState(0);
    const [busy, setBusy] = useState(false);
    const [reason, setReason] = useState("");
    const [proofError, setProofError] = useState(false);
    useEffect(() => {
        let cancelled = false;
        api.admin.orders.get(eventId, orderId).then(apiData).then((data) => { if (!cancelled) { setOrder(data); setError(null); } })
            .catch((cause: unknown) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "โหลดคำสั่งซื้อไม่สำเร็จ"); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [eventId, orderId, revision]);

    async function review(decision: OrderReviewInput["decision"]) {
        if (decision === "REJECT" && !reason.trim()) { toast.error("กรุณาระบุเหตุผลที่ไม่อนุมัติ"); return; }
        setBusy(true);
        try { apiData(await api.admin.orders.review(eventId, orderId, { decision, reason })); onUpdated(); }
        catch (cause) { toast.error(cause instanceof Error ? cause.message : "บันทึกไม่สำเร็จ"); }
        finally { setBusy(false); }
    }

    if (loading || error || !order) return <AdminFeedback loading={loading} error={error} retry={() => { setLoading(true); setRevision(revision + 1); }} />;
    const reviewable = order.status === "PENDING" && order.hasPaymentSlip;
    return <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <section className="min-w-0 space-y-4">
            <div className="rounded-xl border p-4"><p className="break-all text-sm font-medium">{order.orderNo}</p><p className="mt-2 text-3xl font-semibold tabular-nums">฿{money(order.total)}</p><p className="mt-2 text-sm text-muted-foreground">{order.buyer.name} · {order.buyer.email}</p>{order.buyer.phone && <p className="text-sm text-muted-foreground">{order.buyer.phone}</p>}</div>
            <div><h2 className="mb-3 font-medium">บัตรและผู้เข้าร่วม</h2><ul className="divide-y rounded-xl border">{order.tickets.map((ticket) => <li key={ticket.id} className="flex justify-between gap-3 p-3 text-sm"><div><p>{ticket.ticketTypeName || "บัตร"}</p><p className="mt-1 text-muted-foreground">{[ticket.firstName, ticket.lastName].filter(Boolean).join(" ") || "ไม่ได้ระบุชื่อ"}</p></div><span className="shrink-0 tabular-nums">฿{money(ticket.unitPrice)}</span></li>)}</ul></div>
            {order.souvenirItems.length > 0 && <div><h2 className="mb-2 font-medium">ของที่ระลึกเพิ่มเติม</h2>{order.souvenirItems.map((item, index) => <p key={index} className="text-sm">{item.name} {item.size} × {item.quantity} · ฿{money((Number(item.unitPrice) * item.quantity).toFixed(2))}</p>)}</div>}
            {order.shipping && <p className="text-sm">ค่าจัดส่ง ฿{money(order.shippingFee)} · {order.shipping.recipientName}<br />{[order.shipping.addressLine, order.shipping.subDistrict, order.shipping.district, order.shipping.province, order.shipping.postalCode].join(" ")}</p>}
            {order.review && <div className="rounded-xl bg-muted p-4 text-sm"><p>{order.review.decision === "APPROVE" ? "อนุมัติแล้ว" : "ไม่อนุมัติ"} · {new Date(order.review.at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</p>{order.review.reason && <p className="mt-2 whitespace-pre-wrap">{order.review.reason}</p>}</div>}
            {reviewable && <div className="space-y-3"><label htmlFor="review-reason" className="text-sm font-medium">หมายเหตุ / เหตุผลที่ไม่อนุมัติ</label><Textarea id="review-reason" maxLength={500} value={reason} disabled={busy} onChange={(e) => setReason(e.target.value)} placeholder="ต้องระบุเมื่อไม่อนุมัติ" /><p className="text-xs text-muted-foreground">เมื่อไม่อนุมัติ คำสั่งซื้อจะถูกยกเลิกและคืนโควตาบัตร ผลตรวจไม่สามารถย้อนกลับจากหน้านี้</p><div className="flex flex-wrap gap-3"><Button className="min-h-11 bg-brand text-on-brand hover:bg-brand-hover" disabled={busy || proofError} onClick={() => review("APPROVE")}>{busy ? "กำลังบันทึก..." : "อนุมัติและเปิดใช้บัตร"}</Button><Button variant="outline" className="min-h-11 text-destructive" disabled={busy} onClick={() => review("REJECT")}>ไม่อนุมัติ</Button></div></div>}
            {!reviewable && !order.review && <p className="text-sm text-muted-foreground">{order.status === "PENDING" ? "ยังไม่มีสลิปให้ตรวจสอบ" : order.status === "PAID" ? "ชำระแล้ว" : "คำสั่งซื้อถูกยกเลิกแล้ว"}</p>}
            {order.status === "PAID" && order.shipping && <ShippingForm order={order} onSaved={setOrder} />}
        </section>
        <section className="min-w-0"><h2 className="mb-3 font-medium">หลักฐานชำระเงิน</h2>{order.hasPaymentSlip && !proofError ? <Image alt={`สลิปคำสั่งซื้อ ${order.orderNo}`} src={api.admin.orders.slipUrl(eventId, order.id)} width={800} height={1000} unoptimized className="h-auto max-h-[65dvh] w-full rounded-xl border object-contain" onError={() => setProofError(true)} /> : <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">{proofError ? "ไม่สามารถอ่านไฟล์สลิปนี้ได้ กรุณาตรวจข้อมูลกับผู้ซื้อก่อนอนุมัติ" : "ยังไม่มีหลักฐานชำระเงิน"}</p>}</section>
    </div>;
}
