"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { AdminOrderDetail } from "@/lib/api-types";
import { SHIPPING_STATUSES, type ShippingStatus } from "@/server/database/enums/domain.enum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const labels: Record<ShippingStatus, string> = {
  PENDING: "รอเตรียมของ",
  PREPARING: "กำลังเตรียม",
  SHIPPED: "จัดส่งแล้ว",
  DELIVERED: "ส่งถึงแล้ว",
};

export default function ShippingForm({
  eventId,
  order,
  onSaved,
}: {
  eventId: string;
  order: AdminOrderDetail;
  onSaved: (order: AdminOrderDetail) => void;
}) {
  const [status, setStatus] = useState(order.shipping!.status);
  const [carrier, setCarrier] = useState(order.shipping!.carrier ?? "");
  const [tracking, setTracking] = useState(order.shipping!.trackingNumber ?? "");
  const [busy, setBusy] = useState(false);

  const statuses = Object.values(SHIPPING_STATUSES);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    try {
      const res = await api.admin.orders.shipping(eventId, order.id, {
        status,
        carrier: carrier.trim() || undefined,
        trackingNumber: tracking.trim() || undefined,
      });

      if (res.success) {
        toast.success("บันทึกการจัดส่งแล้ว");
        onSaved(res.data);
      } else {
        toast.error(res.error.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึกการจัดส่ง");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-3 rounded-xl border bg-card p-4">
      <h2 className="font-semibold text-sm">จัดการการจัดส่งของที่ระลึก</h2>
      <fieldset disabled={busy} className="space-y-3">
        <Field>
          <FieldLabel htmlFor="shipping-status" className="text-xs font-medium">
            สถานะจัดส่ง
          </FieldLabel>
          <Select
            value={status}
            onValueChange={(value) => {
              if (statuses.includes(value as ShippingStatus)) {
                setStatus(value as ShippingStatus);
              }
            }}
          >
            <SelectTrigger id="shipping-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((value, index) => (
                <SelectItem
                  key={value}
                  value={value}
                  disabled={index < statuses.indexOf(order.shipping!.status)}
                >
                  {labels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="shipping-carrier" className="text-xs font-medium">
            บริษัทขนส่ง
          </FieldLabel>
          <Input
            id="shipping-carrier"
            maxLength={100}
            value={carrier}
            placeholder="เช่น Flash Express, Kerry, ไปรษณีย์ไทย"
            onChange={(e) => setCarrier(e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="shipping-tracking" className="text-xs font-medium">
            เลขพัสดุ (Tracking Number)
          </FieldLabel>
          <Input
            id="shipping-tracking"
            maxLength={100}
            value={tracking}
            placeholder="เช่น TH0123456789"
            onChange={(e) => setTracking(e.target.value)}
          />
        </Field>

        <Button
          variant="outline"
          className="min-h-10 cursor-pointer"
          type="submit"
        >
          {busy ? "กำลังบันทึก..." : "บันทึกการจัดส่ง"}
        </Button>
      </fieldset>
    </form>
  );
}
