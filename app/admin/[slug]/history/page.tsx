"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { AdminActivityItem } from "@/lib/api-types";
import { useAdminAccess } from "@/components/admin/AdminAccess";
import { AdminFeedback, apiData } from "@/components/admin/AdminFeedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const labels: Record<string, string> = { "order.approve": "อนุมัติคำสั่งซื้อ", "order.reject": "ไม่อนุมัติคำสั่งซื้อ", "shipping.update": "อัปเดตจัดส่ง", "event.create": "สร้างงาน", "event.update": "แก้ไขงาน", "ticket.create": "เพิ่มประเภทบัตร", "ticket.update": "แก้ไขประเภทบัตร", "ticket.delete": "ลบประเภทบัตร", "souvenir.create": "เพิ่มของที่ระลึก", "souvenir.update": "แก้ไขของที่ระลึก", "souvenir.delete": "ลบของที่ระลึก", "store.create": "สร้างร้านค้า", "store.update": "แก้ไขร้านค้า", "store.delete": "ลบร้านค้า", "role.assign": "เพิ่มบทบาท", "role.update": "แก้ไขสิทธิ์", "role.revoke": "ถอนบทบาท", "role.legacy-defaults": "เพิ่มสิทธิ์เริ่มต้นของผู้ดูแลงาน" };

export default function ActivityPage() {
    const { eventId, eventTitle } = useAdminAccess();
    const [items, setItems] = useState<AdminActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [revision, setRevision] = useState(0);
    useEffect(() => {
        let cancelled = false;
        api.admin.activities(eventId).then(apiData).then((data) => { if (!cancelled) { setItems(data); setError(null); } })
            .catch((cause: unknown) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "โหลดประวัติไม่สำเร็จ"); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [eventId, revision]);
    const filtered = items.filter((item) => [labels[item.action] || item.action, item.actorName, item.note, item.targetId].some((value) => value?.toLowerCase().includes(query.trim().toLowerCase())));
    function reload() { setLoading(true); setRevision(revision + 1); }
    return <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6"><header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold">ประวัติแก้ไข</h1><p className="mt-2 text-sm text-muted-foreground">{eventTitle} · แสดงประวัติล่าสุด 200 รายการ</p></div><Button variant="outline" className="min-h-11" onClick={reload}>รีเฟรชข้อมูล</Button></header>
        <div className="space-y-2"><label htmlFor="activity-search" className="text-sm font-medium">ค้นหาประวัติ</label><Input id="activity-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="การดำเนินการ ผู้ดูแล หรือเหตุผล" /></div>
        <AdminFeedback loading={loading} error={error} retry={reload} />
        {!loading && !error && <div className="rounded-xl border bg-background p-4"><Table><TableHeader><TableRow><TableHead>วันเวลา</TableHead><TableHead>การดำเนินการ</TableHead><TableHead>ผู้ดูแล</TableHead><TableHead>หมายเหตุ / รายการ</TableHead></TableRow></TableHeader><TableBody>{filtered.length ? filtered.map((item) => <TableRow key={item.id}><TableCell className="whitespace-nowrap">{new Date(item.createdAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</TableCell><TableCell>{labels[item.action] || item.action}</TableCell><TableCell>{item.actorName || "ระบบ"}</TableCell><TableCell><p className="max-w-md whitespace-pre-wrap break-words">{item.note || "—"}</p><p className="mt-1 text-xs text-muted-foreground">{item.targetId}</p></TableCell></TableRow>) : <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">ยังไม่มีประวัติที่ตรงกัน</TableCell></TableRow>}</TableBody></Table></div>}
    </div>;
}
