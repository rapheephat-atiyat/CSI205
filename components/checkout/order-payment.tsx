"use client";

import { CheckCircle2, Clock3, FileUp, QrCode, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { api } from "@/lib/api-client";
import type { OrderDetail } from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckoutFrame, CheckoutPanel, money, orderDate } from "./checkout-ui";

function readProof(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Invalid file"));
        reader.readAsDataURL(file);
    });
}

export function OrderPayment({ order, event, paymentQr }: {
    order: OrderDetail; event: { title: string; slug: string }; paymentQr: string | null;
}) {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(Boolean(order.hasPaymentSlip || order.paymentSlip));
    const [confirmCancel, setConfirmCancel] = useState(false);
    const running = useRef(false);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!file || running.current) return;
        if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 2 * 1024 * 1024) {
            setError("กรุณาเลือกรูปสลิป PNG หรือ JPEG ขนาดไม่เกิน 2 MB");
            return;
        }
        running.current = true;
        setBusy(true);
        setError("");
        try {
            const result = await api.orders.submitPayment(order.id, await readProof(file));
            if (!result.success) setError(result.error.message);
            else {
                setSent(true);
                setFile(null);
                router.refresh();
            }
        } catch {
            setError("อ่านไฟล์สลิปไม่สำเร็จ กรุณาเลือกไฟล์ใหม่");
        } finally {
            running.current = false;
            setBusy(false);
        }
    }

    async function cancel() {
        if (running.current) return;
        running.current = true;
        setBusy(true);
        setError("");
        const result = await api.orders.cancel(order.id);
        if (result.success) router.replace("/account/orders");
        else {
            setError(result.error.message);
            setBusy(false);
            running.current = false;
        }
    }

    if (order.status !== "PENDING" || sent) {
        const paid = order.status === "PAID";
        const cancelled = order.status === "CANCELLED";
        const Icon = paid ? CheckCircle2 : cancelled ? XCircle : Clock3;
        return (
            <CheckoutFrame step={4} event={event}>
                <CheckoutPanel title={paid ? "ชำระเงินสำเร็จ" : cancelled ? "คำสั่งซื้อถูกยกเลิก" : "ส่งหลักฐานแล้ว รอตรวจสอบ"} className="mx-auto max-w-2xl">
                    <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand"><Icon aria-hidden="true" className="size-6" /></span>
                    <p className="text-sm text-muted-foreground">{paid ? "เปิด QR บัตรของคุณเพื่อใช้เช็กอินที่หน้างาน" : cancelled ? "ดูรายละเอียดรายการนี้ได้จากประวัติคำสั่งซื้อ" : "ระบบได้รับสลิปแล้ว คุณติดตามผลได้จากประวัติคำสั่งซื้อ"}</p>
                    <dl className="space-y-3 rounded-lg border p-4 text-sm">
                        <div className="space-y-1"><dt className="text-muted-foreground">เลขคำสั่งซื้อ</dt><dd className="font-medium wrap-anywhere">{order.orderNo}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">วันที่สั่งซื้อ</dt><dd>{orderDate(order.createdAt)}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">ยอดรวม</dt><dd className="font-semibold">{money(order.total)}</dd></div>
                    </dl>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="brand" className="h-11"><Link href={paid ? `/account/tickets?order=${order.id}` : "/account/orders"}>{paid ? "ดู QR บัตร" : "ดูประวัติคำสั่งซื้อ"}</Link></Button>
                        {!paid && !cancelled && <Button type="button" variant="outline" className="h-11" onClick={() => router.refresh()}>ตรวจสถานะอีกครั้ง</Button>}
                    </div>
                </CheckoutPanel>
            </CheckoutFrame>
        );
    }

    return (
        <CheckoutFrame step={4} event={event}>
            <div className="grid items-start gap-5 lg:grid-cols-2">
                <CheckoutPanel title="สแกน QR เพื่อโอนเงิน">
                    <p className="text-sm text-muted-foreground">เลขคำสั่งซื้อ <strong className="font-medium text-foreground wrap-anywhere">{order.orderNo}</strong></p>
                    <p className="text-3xl font-semibold tabular-nums text-brand">{money(order.total)}</p>
                    {paymentQr ? <>
                        <Image src={paymentQr} alt="QR สำหรับชำระเงินให้ผู้จัดงาน" width={224} height={224} unoptimized className="aspect-square rounded-lg border bg-white object-contain p-2" />
                        <Button asChild variant="outline" className="h-10">
                            {paymentQr.startsWith("/")
                                ? <a href={paymentQr} download>บันทึก QR</a>
                                : <a href={paymentQr} target="_blank" rel="noreferrer">เปิดรูป QR</a>}
                        </Button>
                    <p className="text-sm text-muted-foreground">โอนตามยอดด้านบน แล้วแนบสลิป{order.paymentDueAt ? `ก่อน ${orderDate(order.paymentDueAt)} น.` : "เป็นหลักฐาน"}</p>
                    </> : <p role="status" className="flex gap-2 text-sm text-muted-foreground"><QrCode className="size-4 shrink-0" aria-hidden="true" /> ผู้จัดงานยังไม่ได้ตั้งค่า QR ชำระเงิน</p>}
                </CheckoutPanel>
                <CheckoutPanel title="แนบสลิปการโอน">
                    <form className="space-y-4" onSubmit={submit}>
                        <div className="space-y-2 rounded-lg border border-dashed p-4">
                            <Label htmlFor="payment-slip"><FileUp className="size-4" aria-hidden="true" /> เลือกรูปสลิป</Label>
                            <Input id="payment-slip" type="file" accept="image/png,image/jpeg" aria-describedby="payment-help" disabled={busy} required onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(""); }} />
                            <p id="payment-help" className="text-xs text-muted-foreground">PNG หรือ JPEG ขนาดไม่เกิน 2 MB</p>
                        </div>
                        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" variant="brand" className="h-11 w-full" disabled={!file || busy}>{busy ? "กำลังบันทึก…" : "ส่งหลักฐานการชำระเงิน"}</Button>
                    </form>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" className="h-10"><Link href="/account/orders">กลับไปที่ประวัติ</Link></Button>
                        <Button type="button" variant="ghost" className="h-10" disabled={busy} onClick={() => setConfirmCancel(!confirmCancel)}>ยกเลิกคำสั่งซื้อ</Button>
                    </div>
                    {confirmCancel && <div className="space-y-2 rounded-lg border p-3">
                        <p className="text-sm">ยกเลิกได้หากยังไม่ได้โอนเงิน ระบบจะคืนบัตรที่จองไว้</p>
                        <Button type="button" variant="destructive" disabled={busy} onClick={cancel}>ยืนยันยกเลิก</Button>
                    </div>}
                </CheckoutPanel>
            </div>
        </CheckoutFrame>
    );
}
