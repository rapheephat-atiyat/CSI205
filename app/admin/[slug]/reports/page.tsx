"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { makeAdminCsv, type ExportCell } from "@/lib/admin-export";
import type { AdminExportReport } from "@/lib/api-types";
import { useAdminAccess } from "@/components/admin/AdminAccess";
import { AdminFeedback, apiData } from "@/components/admin/AdminFeedback";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function saveFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = filename; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ReportsPage() {
    const { eventId, eventTitle, slug } = useAdminAccess();
    const [report, setReport] = useState<AdminExportReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [revision, setRevision] = useState(0);
    useEffect(() => {
        let cancelled = false;
        api.admin.exportReport(eventId).then(apiData).then((data) => { if (!cancelled) { setReport(data); setError(null); } })
            .catch((cause: unknown) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "โหลดรายงานไม่สำเร็จ"); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [eventId, revision]);
    const sections: { id: string; title: string; description: string; rows: ExportCell[][] }[] = report ? [
        { id: "tickets", title: "รายงานบัตร", description: "จำนวนที่จองรวมการรอชำระ รายได้คำนวณจากราคาบัตรในคำสั่งซื้อที่ชำระแล้ว", rows: [
            ["ประเภทบัตร", "ราคาปัจจุบัน", "โควตา", "จองรวม", "ชำระแล้ว", "รายได้ค่าบัตร"],
            ...report.tickets.map((ticket) => [ticket.name, Number(ticket.price), ticket.quota, ticket.sold, ticket.paidTickets, Number(ticket.paidRevenue)]),
        ] },
        { id: "stores", title: "รายงานร้านค้า", description: "สินค้าและยอด Token คงเหลือของร้านในงานนี้", rows: [
            ["ร้านค้า", "สินค้า", "ราคา Token", "Token คงเหลือ", "ผู้ดูแล"],
            ...report.stores.map((store) => [store.name, store.product?.title ?? null, store.product ? Number(store.product.price) : null, Number(store.walletBalance), store.managers.map((manager) => manager.name).join(", ")]),
        ] },
        { id: "transactions", title: "ธุรกรรมกระเป๋าร้านค้า", description: "รายการล่าสุด 100 รายการ เฉพาะกระเป๋าร้านค้าในงานนี้", rows: [
            ["วันเวลา", "ประเภท", "สถานะ", "จำนวน Token", "ยอดก่อน", "ยอดหลัง", "อ้างอิง", "หมายเหตุ"],
            ...report.auditLog.map((item) => [item.createdAt, item.type, item.status, Number(item.amount), Number(item.before), Number(item.after), item.ref, item.note]),
        ] },
    ] : [];
    async function download(id: string, title: string, rows: ExportCell[][], format: "csv" | "xlsx") {
        setBusy(true);
        try {
            if (format === "csv") saveFile(new Blob([makeAdminCsv(rows)], { type: "text/csv;charset=utf-8" }), `${slug}-${id}.csv`);
            else {
                const ExcelJS = (await import("exceljs")).default;
                const workbook = new ExcelJS.Workbook();
                const sheet = workbook.addWorksheet(title); sheet.addRows(rows);
                sheet.getRow(1).font = { bold: true };
                sheet.columns.forEach((column) => { column.width = 24; });
                const buffer = await workbook.xlsx.writeBuffer();
                saveFile(new Blob([new Uint8Array(buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${slug}-${id}.xlsx`);
            }
            toast.success("เตรียมไฟล์รายงานแล้ว");
        } catch (cause) { toast.error(cause instanceof Error ? cause.message : "ส่งออกรายงานไม่สำเร็จ"); }
        finally { setBusy(false); }
    }
    return <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6"><header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold">รายงานและส่งออก</h1><p className="mt-2 text-sm text-muted-foreground">{eventTitle}</p></div><Button variant="outline" className="min-h-11" onClick={() => { setLoading(true); setRevision(revision + 1); }}>รีเฟรชข้อมูล</Button></header>
        <AdminFeedback loading={loading} error={error} retry={() => { setLoading(true); setRevision(revision + 1); }} />
        {!loading && !error && sections.map((section) => <section key={section.id} className="space-y-4 rounded-xl border bg-background p-4 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-semibold">{section.title}</h2><p className="mt-2 text-sm text-muted-foreground">{section.description}</p></div><div className="flex gap-3"><Button variant="outline" className="min-h-11" disabled={busy} onClick={() => download(section.id, section.title, section.rows, "csv")}>ดาวน์โหลด CSV</Button><Button variant="outline" className="min-h-11" disabled={busy} onClick={() => download(section.id, section.title, section.rows, "xlsx")}>ดาวน์โหลด Excel</Button></div></div>
            <Table><TableHeader><TableRow>{section.rows[0].map((cell, index) => <TableHead key={index}>{cell}</TableHead>)}</TableRow></TableHeader><TableBody>{section.rows.length === 1 ? <TableRow><TableCell colSpan={section.rows[0].length} className="h-24 text-center text-muted-foreground">ยังไม่มีข้อมูล</TableCell></TableRow> : section.rows.slice(1).map((row, index) => <TableRow key={index}>{row.map((cell, column) => <TableCell key={column} className="tabular-nums">{cell ?? "—"}</TableCell>)}</TableRow>)}</TableBody></Table>
        </section>)}
    </div>;
}
