"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { AdminOrderDetail } from "@/lib/api-types";
import { SHIPPING_STATUSES, type ShippingStatus } from "@/server/database/enums/domain.enum";
import { useAdminAccess } from "@/components/admin/AdminAccess";
import { apiData } from "@/components/admin/AdminFeedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const labels: Record<ShippingStatus, string> = { PENDING: "รอเตรียมของ", PREPARING: "กำลังเตรียม", SHIPPED: "จัดส่งแล้ว", DELIVERED: "ส่งถึงแล้ว" };

export default function ShippingForm({ order, onSaved }: { order: AdminOrderDetail; onSaved: (order: AdminOrderDetail) => void }) {
    const { eventId } = useAdminAccess();
    const [status, setStatus] = useState(order.shipping!.status);
    const [carrier, setCarrier] = useState(order.shipping!.carrier ?? "");
    const [tracking, setTracking] = useState(order.shipping!.trackingNumber ?? "");
    const [busy, setBusy] = useState(false);
    const statuses = Object.values(SHIPPING_STATUSES);
    async function save(event: React.FormEvent) {
        event.preventDefault(); setBusy(true);
        try { onSaved(apiData(await api.admin.orders.shipping(eventId, order.id, { status, carrier, trackingNumber: tracking }))); toast.success("บันทึกการจัดส่งแล้ว"); }
        catch (cause) { toast.error(cause instanceof Error ? cause.message : "บันทึกไม่สำเร็จ"); }
        finally { setBusy(false); }
    }
    return <form onSubmit={save} className="space-y-3 rounded-xl border p-4"><h2 className="font-medium">จัดส่งของที่ระลึก</h2><fieldset disabled={busy} className="space-y-3">
        <div className="space-y-2"><label htmlFor="shipping-status" className="text-sm">สถานะจัดส่ง</label><Select value={status} onValueChange={(value) => { if (statuses.includes(value as ShippingStatus)) setStatus(value as ShippingStatus); }}><SelectTrigger id="shipping-status" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{statuses.map((value, index) => <SelectItem key={value} value={value} disabled={index < statuses.indexOf(order.shipping!.status)}>{labels[value]}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><label htmlFor="shipping-carrier" className="text-sm">ขนส่ง</label><Input id="shipping-carrier" maxLength={100} value={carrier} onChange={(e) => setCarrier(e.target.value)} /></div>
        <div className="space-y-2"><label htmlFor="shipping-tracking" className="text-sm">เลขติดตาม</label><Input id="shipping-tracking" maxLength={100} value={tracking} onChange={(e) => setTracking(e.target.value)} /></div>
        <Button variant="outline" className="min-h-11" type="submit">{busy ? "กำลังบันทึก..." : "บันทึกการจัดส่ง"}</Button>
    </fieldset></form>;
}
