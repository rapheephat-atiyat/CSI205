"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { EventOverviewReport } from "@/lib/api-types";
import { api } from "@/lib/api-client";
import { PERMISSIONS } from "@/lib/permissions";
import { useAdminAccess } from "@/components/admin/AdminAccess";
import { AdminFeedback, apiData } from "@/components/admin/AdminFeedback";
import { EnterEventCard } from "@/components/admin/EnterEventCard";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
    const { eventId, eventTitle, slug, can } = useAdminAccess();
    const readable = can(PERMISSIONS.REPORT_READ);
    const [report, setReport] = useState<EventOverviewReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [revision, setRevision] = useState(0);
    useEffect(() => {
        if (!readable) return;
        let cancelled = false;
        api.admin.eventOverview(eventId).then(apiData).then((data) => { if (!cancelled) { setReport(data); setError(null); } })
            .catch((cause: unknown) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "โหลดภาพรวมไม่สำเร็จ"); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [eventId, readable, revision]);
    const money = (value: string) => Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2 });
    if (!readable) return <div className="p-6"><h1 className="text-xl font-semibold">{eventTitle}</h1><p className="mt-3 text-muted-foreground">เลือกเมนูที่คุณมีสิทธิ์ใช้งานจากแถบด้านข้าง</p></div>;
    return <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
        <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold">ภาพรวมงาน</h1><p className="mt-2 text-sm text-muted-foreground">{eventTitle}</p></div><Button variant="outline" className="min-h-11" onClick={() => { setLoading(true); setRevision(revision + 1); }}>รีเฟรชข้อมูล</Button></header>
        <AdminFeedback loading={loading} error={error} retry={() => { setLoading(true); setRevision(revision + 1); }} />
        {!loading && !error && report && <>
            <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[
                ["บัตรที่ถูกจอง", report.totalTicketsSold.toLocaleString("th-TH"), "ใบ"],
                ["เช็กอินแล้ว", report.totalCheckedIn.toLocaleString("th-TH"), "ใบ"],
                ["ยอดชำระเงิน", money(report.totalTicketRevenue), "บาท"],
                ["ยอดขายร้านค้า", money(report.totalStoreVolume), "Token"],
            ].map(([label, value, unit]) => <div key={label} className="rounded-xl border bg-background p-4"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-3 text-2xl font-semibold tabular-nums">{value} <span className="text-sm font-normal text-muted-foreground">{unit}</span></dd></div>)}</dl>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
                <section className="min-w-0 rounded-xl border bg-background p-4"><h2 className="mb-4 font-semibold">ผู้เข้างานรายชั่วโมง</h2><EnterEventCard data={report.checkIns} /></section>
                <section className="space-y-4 rounded-xl border bg-background p-4"><h2 className="font-semibold">รอตรวจสอบการชำระเงิน</h2><p className="text-3xl font-semibold tabular-nums">{report.pendingOrders} <span className="text-base font-normal text-muted-foreground">คำสั่งซื้อ</span></p><p className="text-sm text-muted-foreground">บัตรรออนุมัติ {report.pendingTickets} ใบ · ฿{money(report.pendingAmount)}</p><p className="text-sm text-muted-foreground">ชำระแล้วทั้งหมด {report.paidOrders} คำสั่งซื้อ</p>{can(PERMISSIONS.ORDER_REVIEW) && <Button asChild className="min-h-11 w-full bg-brand text-on-brand hover:bg-brand-hover"><Link href={`/admin/${encodeURIComponent(slug)}/tickets/payments`}>เปิดคิวตรวจสอบ</Link></Button>}</section>
            </div>
        </>}
    </div>;
}
