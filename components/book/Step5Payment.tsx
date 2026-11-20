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
import BookLayout from "./BookLayout";
import { BookCard, money, orderDate } from "./BookUI";

function readSlipAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Invalid file"));
        reader.readAsDataURL(file);
    });
}

export function Step5Payment({ order, event, paymentQr }: {
    order: OrderDetail;
    event: { title: string; slug: string };
    paymentQr: string | null;
}) {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [hasSentSlip, setHasSentSlip] = useState(Boolean(order.hasPaymentSlip || order.paymentSlip));
    const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
    const requestInProgress = useRef(false);

    async function submitSlip(formEvent: FormEvent<HTMLFormElement>) {
        formEvent.preventDefault();
        if (!file || requestInProgress.current) return;
        if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 2 * 1024 * 1024) {
            setErrorMessage("กรุณาเลือกรูปสลิป PNG หรือ JPEG ขนาดไม่เกิน 2 MB");
            return;
        }
        requestInProgress.current = true;
        setIsSaving(true);
        setErrorMessage("");
        try {
            const result = await api.orders.submitPayment(order.id, await readSlipAsDataUrl(file));
            if (!result.success) {
                setErrorMessage(result.error.message);
                return;
            }

            setHasSentSlip(true);
            setFile(null);
            router.refresh();
        } catch {
            setErrorMessage("อ่านไฟล์สลิปไม่สำเร็จ กรุณาเลือกไฟล์ใหม่");
        } finally {
            requestInProgress.current = false;
            setIsSaving(false);
        }
    }

    async function cancelOrder() {
        if (requestInProgress.current) return;
        requestInProgress.current = true;
        setIsSaving(true);
        setErrorMessage("");
        const result = await api.orders.cancel(order.id);
        if (result.success) {
            router.replace("/account/orders");
            return;
        }

        setErrorMessage(result.error.message);
        setIsSaving(false);
        requestInProgress.current = false;
    }

    if (order.status !== "PENDING" || hasSentSlip) {
        const isPaid = order.status === "PAID";
        const isCancelled = order.status === "CANCELLED";
        const tokenReward = order.tickets.reduce((sum, ticket) => sum + ticket.tokenReward, 0);
        const Icon = isPaid ? CheckCircle2 : isCancelled ? XCircle : Clock3;
        return (
            <BookLayout step={5} event={event}>
                <BookCard title={isPaid ? "ชำระเงินสำเร็จ" : isCancelled ? "คำสั่งซื้อถูกยกเลิก" : "ส่งหลักฐานแล้ว รอตรวจสอบ"} className="mx-auto max-w-2xl text-center">
                    <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-yellow-200 text-yellow-600"><Icon aria-hidden="true" className="size-6" /></span>
                    <p className="text-sm text-muted-foreground">{isPaid ? "เปิด QR บัตรของคุณเพื่อใช้เช็กอินที่หน้างาน" : isCancelled ? "ดูรายละเอียดรายการนี้ได้จากประวัติคำสั่งซื้อ" : "ระบบได้รับสลิปแล้ว คุณติดตามผลได้จากประวัติคำสั่งซื้อ"}</p>
                    <dl className="space-y-3 rounded-lg border p-4 text-sm">
                        <div className="space-y-1"><dt className="text-muted-foreground">เลขคำสั่งซื้อ</dt><dd className="font-medium wrap-anywhere">{order.orderNo}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">วันที่สั่งซื้อ</dt><dd>{orderDate(order.createdAt)}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">ยอดรวม</dt><dd className="font-semibold">{money(order.total)}</dd></div>
                        {!isCancelled && tokenReward > 0 && (
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">{isPaid ? "Token เข้ากระเป๋าแล้ว" : "Token หลังยืนยันการชำระ"}</dt>
                                <dd className="font-semibold">{tokenReward.toLocaleString("th-TH")} Token</dd>
                            </div>
                        )}
                    </dl>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="brand" className="h-11"><Link href={isPaid ? `/account/tickets?order=${order.id}` : "/account/orders"}>{isPaid ? "ดู QR บัตร" : "ดูประวัติคำสั่งซื้อ"}</Link></Button>
                        {!isPaid && !isCancelled && <Button type="button" variant="outline" className="h-11" onClick={() => router.refresh()}>ตรวจสถานะอีกครั้ง</Button>}
                    </div>
                </BookCard>
            </BookLayout>
        );
    }

    return (
        <BookLayout step={5} event={event}>
            <div className="grid items-start gap-5 lg:grid-cols-2">
                <BookCard title="สแกน QR เพื่อโอนเงิน">
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
                </BookCard>
                <BookCard title="แนบสลิปการโอน">
                    <form className="space-y-4" onSubmit={submitSlip}>
                        <div className="space-y-2 rounded-lg border border-dashed p-4">
                            <Label htmlFor="payment-slip"><FileUp className="size-4" aria-hidden="true" /> เลือกรูปสลิป</Label>
                            <Input id="payment-slip" type="file" accept="image/png,image/jpeg" aria-describedby="payment-help" disabled={isSaving} required onChange={(e) => { setFile(e.target.files?.[0] ?? null); setErrorMessage(""); }} />
                            <p id="payment-help" className="text-xs text-muted-foreground">PNG หรือ JPEG ขนาดไม่เกิน 2 MB</p>
                        </div>
                        {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
                        <Button type="submit" variant="brand" className="h-11 w-full" disabled={!file || isSaving}>{isSaving ? "กำลังบันทึก…" : "ส่งหลักฐานการชำระเงิน"}</Button>
                    </form>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" className="h-10"><Link href="/account/orders">กลับไปที่ประวัติ</Link></Button>
                        <Button type="button" variant="ghost" className="h-10" disabled={isSaving} onClick={() => setShowCancelConfirmation(!showCancelConfirmation)}>ยกเลิกคำสั่งซื้อ</Button>
                    </div>
                    {showCancelConfirmation && <div className="space-y-2 rounded-lg border p-3">
                        <p className="text-sm">ยกเลิกได้หากยังไม่ได้โอนเงิน ระบบจะคืนบัตรที่จองไว้</p>
                        <Button type="button" variant="destructive" disabled={isSaving} onClick={cancelOrder}>ยืนยันยกเลิก</Button>
                    </div>}
                </BookCard>
            </div>
        </BookLayout>
    );
}
