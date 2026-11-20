"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { bookingDateLabel } from "@/lib/booking-days";
import type { AdminOrderDetail } from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Maximize2,
  Package,
} from "lucide-react";
import ShippingForm from "./ShippingForm";

const money = (value: string | number) =>
  Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2 });

export default function OrderReviewDialog({
  eventId,
  orderId,
  onClose,
  onUpdated,
  onNavigateNext,
  onNavigatePrev,
  hasNext = false,
  hasPrev = false,
}: {
  eventId: string;
  orderId: string | null;
  onClose: () => void;
  onUpdated: () => void;
  onNavigateNext?: () => void;
  onNavigatePrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}) {
  return (
    <Dialog
      open={orderId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-5xl p-6">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <div>
              <DialogTitle className="text-xl font-semibold">
                รายละเอียดคำสั่งซื้อ
              </DialogTitle>
              <DialogDescription className="mt-1">
                ตรวจยอดและหลักฐานชำระเงินก่อนยืนยัน ผลการตรวจจะเปิดใช้หรือยกเลิกบัตรจริง
              </DialogDescription>
            </div>
            {(onNavigatePrev || onNavigateNext) && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={!hasPrev}
                  onClick={onNavigatePrev}
                  title="คำสั่งซื้อก่อนหน้า"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={!hasNext}
                  onClick={onNavigateNext}
                  title="คำสั่งซื้อถัดไป"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {orderId && (
          <OrderContent
            key={orderId}
            eventId={eventId}
            orderId={orderId}
            onUpdated={onUpdated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function OrderContent({
  eventId,
  orderId,
  onUpdated,
}: {
  eventId: string;
  orderId: string;
  onUpdated: () => void;
}) {
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [proofError, setProofError] = useState(false);
  const [zoomSlip, setZoomSlip] = useState(false);

  // ดึงรายละเอียดคำสั่งซื้อ
  useEffect(() => {
    async function fetchOrder() {
      setLoading(true);
      setError(null);
      const res = await api.admin.orders.get(eventId, orderId);
      if (res.success) {
        setOrder(res.data);
      } else {
        setError(res.error.message);
      }
      setLoading(false);
    }
    fetchOrder();
  }, [eventId, orderId]);

  // พิจารณาอนุมัติหรือไม่อนุมัติ
  async function handleReview(decision: "APPROVE" | "REJECT") {
    if (decision === "REJECT" && !reason.trim()) {
      toast.error("กรุณาระบุเหตุผลที่ไม่อนุมัติ");
      return;
    }

    setBusy(true);
    try {
      const res = await api.admin.orders.review(eventId, orderId, {
        decision,
        reason: reason.trim() || undefined,
      });

      if (res.success) {
        toast.success(
          decision === "APPROVE"
            ? "อนุมัติคำสั่งซื้อและเปิดใช้บัตรแล้ว"
            : "ปฏิเสธคำสั่งซื้อและคืนโควตาแล้ว"
        );
        onUpdated();
      } else {
        toast.error(res.error.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึกผลการตรวจสอบ");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 py-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 text-center text-destructive">
        {error ?? "ไม่พบข้อมูลคำสั่งซื้อ"}
      </div>
    );
  }

  const reviewable = order.status === "PENDING" && order.hasPaymentSlip;

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2 pt-2">
      {/* ข้อมูลคำสั่งซื้อและผู้ซื้อ */}
      <section className="min-w-0 space-y-4">
        {/* กล่องสรุปคำสั่งซื้อ */}
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-base break-all">
              เลขที่ {order.orderNo}
            </p>
            {order.status === "PAID" && (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-300 gap-1"
              >
                <CheckCircle2 className="size-3.5" /> ชำระแล้ว
              </Badge>
            )}
            {order.status === "PENDING" && (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-300 gap-1"
              >
                <Clock className="size-3.5" />
                {order.hasPaymentSlip ? "รอตรวจสลิป" : "รอชำระเงิน"}
              </Badge>
            )}
            {order.status === "CANCELLED" && (
              <Badge
                variant="outline"
                className="bg-red-50 text-red-700 border-red-300 gap-1"
              >
                <XCircle className="size-3.5" /> ยกเลิกแล้ว
              </Badge>
            )}
          </div>

          {order.attendanceDate && (
            <p className="text-sm text-muted-foreground">
              วันที่เข้าร่วม <time dateTime={order.attendanceDate}>{bookingDateLabel(order.attendanceDate)}</time>
            </p>
          )}
          <p className="text-3xl font-semibold tabular-nums text-foreground">
            ฿{money(order.total)}
          </p>

          <div className="border-t pt-2 text-sm text-muted-foreground space-y-0.5">
            <p className="font-medium text-foreground">
              ผู้ซื้อ: {order.buyer.name}
            </p>
            <p>อีเมล: {order.buyer.email}</p>
            {order.buyer.phone && <p>โทรศัพท์: {order.buyer.phone}</p>}
            <p className="text-xs pt-1">
              สร้างเมื่อ:{" "}
              {new Date(order.createdAt).toLocaleString("th-TH", {
                timeZone: "Asia/Bangkok",
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            {order.paidAt && (
              <p className="text-xs text-green-700">
                ชำระเมื่อ:{" "}
                {new Date(order.paidAt).toLocaleString("th-TH", {
                  timeZone: "Asia/Bangkok",
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>
        </div>

        {/* บัตรและผู้เข้าร่วม */}
        <div className="space-y-2">
          <h2 className="font-semibold text-sm">บัตรและผู้เข้าร่วม</h2>
          <ul className="divide-y rounded-xl border bg-card">
            {order.tickets.map((ticket) => (
              <li
                key={ticket.id}
                className="flex items-start justify-between gap-3 p-3 text-sm"
              >
                <div className="space-y-0.5">
                  <p className="font-medium">
                    {ticket.ticketTypeName || "บัตรเข้างาน"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ผู้ถือบัตร:{" "}
                    {[ticket.firstName, ticket.lastName]
                      .filter(Boolean)
                      .join(" ") || "ไม่ระบุชื่อ"}
                  </p>
                  {ticket.phone && (
                    <p className="text-xs text-muted-foreground">
                      โทร: {ticket.phone}
                    </p>
                  )}
                  {ticket.email && (
                    <p className="text-xs text-muted-foreground">
                      อีเมล: {ticket.email}
                    </p>
                  )}
                  {ticket.souvenirItems?.length > 0 && (
                    <p className="text-xs text-amber-700 pt-0.5">
                      ของที่ระลึก:{" "}
                      {ticket.souvenirItems
                        .map((s) => `${s.name}${s.size ? ` (${s.size})` : ""}`)
                        .join(", ")}
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-medium tabular-nums">
                  ฿{money(ticket.unitPrice)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* ของที่ระลึกเพิ่มเติม */}
        {order.souvenirItems.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-semibold text-sm">ของที่ระลึกที่สั่งซื้อเพิ่ม</h2>
            <div className="rounded-xl border bg-card divide-y">
              {order.souvenirItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.size ? `ไซซ์ ${item.size}` : "ขนาดมาตรฐาน"} ×{" "}
                      {item.quantity}
                    </p>
                  </div>
                  <span className="tabular-nums font-medium">
                    ฿{money(Number(item.unitPrice) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ข้อมูลจัดส่ง */}
        {order.shipping && (
          <div className="rounded-xl border bg-card p-4 text-sm space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <Package className="size-4 text-brand" />
              <span>การจัดส่งของที่ระลึก</span>
            </div>
            <p className="pt-1">
              <span className="text-muted-foreground">ผู้รับ:</span>{" "}
              {order.shipping.recipientName} ({order.shipping.recipientPhone})
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {[
                order.shipping.addressLine,
                order.shipping.subDistrict,
                order.shipping.district,
                order.shipping.province,
                order.shipping.postalCode,
              ]
                .filter(Boolean)
                .join(" ")}
            </p>
            {Number(order.shippingFee) > 0 && (
              <p className="text-xs pt-1">
                ค่าจัดส่ง: ฿{money(order.shippingFee)}
              </p>
            )}
            {order.shipping.carrier && (
              <p className="text-xs text-foreground font-medium pt-1">
                ขนส่ง: {order.shipping.carrier} | เลขพัสดุ:{" "}
                {order.shipping.trackingNumber ?? "-"}
              </p>
            )}
          </div>
        )}

        {/* ผลการตรวจสอบเดิม (ถ้ามี) */}
        {order.review && (
          <div className="rounded-xl bg-muted/60 p-4 text-sm space-y-1">
            <p className="font-semibold">
              ผลการตรวจ:{" "}
              {order.review.decision === "APPROVE" ? (
                <span className="text-green-700">อนุมัติแล้ว</span>
              ) : (
                <span className="text-red-700">ไม่อนุมัติ</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              ตรวจสอบเมื่อ:{" "}
              {new Date(order.review.at).toLocaleString("th-TH", {
                timeZone: "Asia/Bangkok",
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            {order.review.reason && (
              <p className="mt-1 text-xs whitespace-pre-wrap bg-background p-2 rounded-md border">
                {order.review.reason}
              </p>
            )}
          </div>
        )}

        {/* ส่วนอนุมัติ / ไม่อนุมัติ */}
        {reviewable && (
          <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50/40 p-4">
            <h3 className="font-semibold text-sm text-foreground">
              พิจารณาการชำระเงิน
            </h3>
            <Field>
              <FieldLabel htmlFor="review-reason" className="text-xs font-medium">
                หมายเหตุ / เหตุผลที่ไม่อนุมัติ
              </FieldLabel>
              <Textarea
                id="review-reason"
                maxLength={500}
                value={reason}
                disabled={busy}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ระบุเหตุผล (บังคับเมื่อไม่อนุมัติ)"
                className="bg-background"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                เมื่อไม่อนุมัติ คำสั่งซื้อจะถูกยกเลิกและคืนโควตาบัตร
                ผลตรวจไม่สามารถย้อนกลับจากหน้านี้
              </p>
            </Field>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                variant="brand"
                className="min-h-10 text-on-brand hover:bg-brand-hover font-medium cursor-pointer"
                disabled={busy || proofError}
                onClick={() => handleReview("APPROVE")}
              >
                {busy ? "กำลังบันทึก..." : "อนุมัติและเปิดใช้บัตร"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-10 text-destructive border-destructive/30 hover:bg-destructive/10 cursor-pointer"
                disabled={busy}
                onClick={() => handleReview("REJECT")}
              >
                ไม่อนุมัติ
              </Button>
            </div>
          </div>
        )}

        {/* ฟอร์มจัดส่งเมื่อชำระแล้ว */}
        {order.status === "PAID" && order.shipping && (
          <ShippingForm
            eventId={eventId}
            order={order}
            onSaved={setOrder}
          />
        )}
      </section>

      {/* หลักฐานชำระเงิน (สลิป) */}
      <section className="min-w-0 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">หลักฐานชำระเงิน</h2>
          {order.hasPaymentSlip && !proofError && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground gap-1"
              onClick={() => setZoomSlip(true)}
            >
              <Maximize2 className="size-3.5" /> ขยายภาพ
            </Button>
          )}
        </div>

        {order.hasPaymentSlip && !proofError ? (
          <div className="relative group rounded-xl border bg-muted/20 p-2 flex flex-col items-center">
            <Image
              alt={`สลิปคำสั่งซื้อ ${order.orderNo}`}
              src={api.admin.orders.slipUrl(eventId, order.id)}
              width={800}
              height={1000}
              unoptimized
              className="h-auto max-h-[62dvh] w-full rounded-lg object-contain cursor-pointer transition-transform hover:scale-[1.01]"
              onClick={() => setZoomSlip(true)}
              onError={() => setProofError(true)}
            />
            <p className="text-xs text-muted-foreground pt-2">
              คลิกเพื่อดูภาพขนาดใหญ่
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {proofError ? (
              <p className="text-destructive">
                ไม่สามารถอ่านไฟล์สลิปนี้ได้ กรุณาตรวจข้อมูลกับผู้ซื้อก่อนอนุมัติ
              </p>
            ) : (
              <p>ยังไม่มีหลักฐานชำระเงิน</p>
            )}
          </div>
        )}
      </section>

      {/* Modal ซูมภาพสลิป */}
      <Dialog open={zoomSlip} onOpenChange={setZoomSlip}>
        <DialogContent className="max-w-4xl p-2 sm:p-4">
          <DialogHeader className="p-2">
            <DialogTitle className="text-base">
              หลักฐานชำระเงิน {order.orderNo}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-2 max-h-[80vh] overflow-auto">
            <Image
              alt={`สลิปคำสั่งซื้อ ${order.orderNo}`}
              src={api.admin.orders.slipUrl(eventId, order.id)}
              width={1200}
              height={1600}
              unoptimized
              className="h-auto w-auto max-h-[75vh] object-contain rounded-md"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
