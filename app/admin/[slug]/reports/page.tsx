"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// ui
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// icon
import { Download } from "lucide-react";

import { api } from "@/lib/api-client";
import type {
  EventDetail,
  EventTicketItem,
  OverviewReport,
  StoreDetail,
  WalletHistoryItem,
} from "@/lib/api-types";

type Cell = string | number | null | undefined;

// ส่งออก CSV ฝั่งเบราว์เซอร์ (ใส่ BOM ให้ Excel อ่านภาษาไทยถูก)
function downloadCsv(filename: string, rows: Cell[][]) {
  const esc = (v: Cell) => {
    if (v === null || v === undefined) return "";
    let s = String(v);

    if (typeof v === "string" && /^[=+\-@]/.test(s)) s = `'${s}`;
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = "\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const num = (v?: string | number | null) =>
  v === null || v === undefined ? "-" : Number(v).toLocaleString("th-TH");

export default function Page() {
  const { slug } = useParams<{ slug: string }>();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [tickets, setTickets] = useState<EventTicketItem[]>([]);
  const [stores, setStores] = useState<
    { id: string; name: string; detail: StoreDetail | null }[]
  >([]);
  const [overview, setOverview] = useState<OverviewReport | null>(null);
  const [auditLog, setAuditLog] = useState<WalletHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const eventRes = await api.events.get(slug);
      if (!eventRes.success) {
        setError(eventRes.error.message);
        setLoading(false);
        return;
      }
      const ev = eventRes.data;
      setEvent(ev);

      const [ticketsRes, storeRes, overviewRes, auditRes] = await Promise.all([
        api.events.tickets.list(ev.id),
        Promise.all(ev.stores.map((s) => api.store.getMy(s.id))),
        api.admin.reports.overview(),
        api.admin.reports.auditLog(),
      ]);

      if (ticketsRes.success) setTickets(ticketsRes.data);
      setStores(
        ev.stores.map((s, i) => ({
          id: s.id,
          name: s.name,
          detail: storeRes[i].success ? storeRes[i].data : null,
        })),
      );
      if (overviewRes.success) setOverview(overviewRes.data);
      if (auditRes.success) setAuditLog(auditRes.data);
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) return <div className="p-4">กำลังโหลด...</div>;
  if (error || !event) return <div className="p-4">{error ?? "ไม่พบงาน"}</div>;

  const ticketRows = tickets.map((t) => ({
    id: t.id,
    name: t.name,
    price: Number(t.price),
    sold: t.sold,
    quota: t.quota,
    revenue: Number(t.price) * t.sold,
  }));
  const totalSold = ticketRows.reduce((s, r) => s + r.sold, 0);
  const totalRevenue = ticketRows.reduce((s, r) => s + r.revenue, 0);

  // ยอดร้านค้า (ยอดโทเคนคงเหลือในกระเป๋าร้าน)
  const storeRows = stores.map((s) => ({
    id: s.id,
    name: s.name,
    product: s.detail?.product?.title ?? null,
    price: s.detail?.product ? Number(s.detail.product.price) : null,
    balance: s.detail ? Number(s.detail.walletBalance) : null,
  }));
  const totalStoreBalance = storeRows.reduce((s, r) => s + (r.balance ?? 0), 0);

  // ---------- ส่งออก ---------- //
  const exports = [
    {
      id: "tickets",
      title: "ยอดขายบัตร",
      description: "ประเภทบัตร • ราคา • ขายแล้ว • จำนวนทั้งหมด • รายได้",
      total: ticketRows.length,
      unit: "ประเภท",
      run: () =>
        downloadCsv(`${slug}-tickets.csv`, [
          [
            "ประเภทบัตร",
            "ราคา (บาท)",
            "ขายแล้ว",
            "จำนวนทั้งหมด",
            "รายได้ (บาท)",
          ],
          ...ticketRows.map((r) => [
            r.name,
            r.price,
            r.sold,
            r.quota,
            r.revenue,
          ]),
        ]),
    },
    {
      id: "stores",
      title: "รายงานร้านค้า",
      description: "ร้านค้า • สินค้า • ราคา • ยอด Token คงเหลือ",
      total: storeRows.length,
      unit: "ร้าน",
      run: () =>
        downloadCsv(`${slug}-stores.csv`, [
          ["ร้านค้า", "สินค้า", "ราคา (Token)", "ยอด Token คงเหลือ"],
          ...storeRows.map((r) => [r.name, r.product, r.price, r.balance]),
        ]),
    },
    {
      id: "audit",
      title: "ความเคลื่อนไหวกระเป๋า Token",
      description: "วันเวลา • ประเภท • สถานะ • จำนวน • ก่อน/หลัง • หมายเหตุ",
      total: auditLog.length,
      unit: "รายการ",
      run: () =>
        downloadCsv(`${slug}-wallet-audit.csv`, [
          [
            "วันเวลา",
            "ประเภท",
            "สถานะ",
            "จำนวน",
            "ก่อน",
            "หลัง",
            "อ้างอิง",
            "หมายเหตุ",
          ],
          ...auditLog.map((h) => [
            h.createdAt,
            h.type,
            h.status,
            h.amount,
            h.before,
            h.after,
            h.ref,
            h.note,
          ]),
        ]),
    },
  ];

  return (
    <div className="p-4 w-full flex mx-auto flex-col items-start justify-center">
      <div className="w-full flex items-center justify-start">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/admin/${slug}`}>
                {event.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>รายงานและส่งออก</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="p-4 mx-auto w-full max-w-7xl flex flex-col items-start justify-center gap-4">
        {/* หัวเรื่อง */}
        <div className="flex flex-col items-start justify-center">
          <div className="text-[24px] font-semibold text-black">
            รายงานและส่งออก
          </div>
          <div className="text-[14px] font-medium text-muted-foreground">
            Export ข้อมูลสำหรับตรวจสอบและนำไปใช้งานภายนอก
          </div>
        </div>

        {/* summary */}
        <div className="w-full grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* บัตรของงานนี้ */}
          <Badge
            variant={"outline"}
            className="p-4 w-full h-full flex flex-col items-start gap-2 rounded-[10px]"
          >
            <div className="flex flex-col items-start gap-0.5">
              <div className="text-lg font-semibold">บัตรของงานนี้</div>
              <div className="text-sm font-medium text-muted-foreground">
                ประมาณจาก ราคา × จำนวนที่ขาย
              </div>
            </div>
            <div className="w-full flex items-center justify-between text-sm">
              <div className="text-muted-foreground">ขายแล้วทั้งหมด</div>
              <div>{num(totalSold)} ใบ</div>
            </div>
            <div className="w-full border"></div>
            <div className="w-full flex items-center justify-between text-sm font-semibold">
              <div>รายได้จากบัตร</div>
              <div>{num(totalRevenue)} บาท</div>
            </div>
          </Badge>

          {/* ร้านค้า */}
          <Badge
            variant={"outline"}
            className="p-4 w-full h-full flex flex-col items-start gap-2 rounded-[10px]"
          >
            <div className="flex flex-col items-start gap-0.5">
              <div className="text-lg font-semibold">ยอด Token ร้านค้า</div>
              <div className="text-sm font-medium text-muted-foreground">
                ยอดคงเหลือในกระเป๋าของร้านในงานนี้
              </div>
            </div>
            <div className="w-full flex items-center justify-between text-sm">
              <div className="text-muted-foreground">จำนวนร้าน</div>
              <div>{storeRows.length} ร้าน</div>
            </div>
            <div className="w-full border"></div>
            <div className="w-full flex items-center justify-between text-sm font-semibold">
              <div>Token คงเหลือรวม</div>
              <div>{num(totalStoreBalance)} Token</div>
            </div>
          </Badge>
        </div>

        {/* overview (ทุกงาน) */}
        {overview && (
          <Badge
            variant={"outline"}
            className="p-4 w-full flex flex-col items-start gap-2 rounded-[10px]"
          >
            <div className="flex flex-col items-start gap-0.5">
              <div className="text-lg font-semibold">ภาพรวมทั้งระบบ</div>
              <div className="text-sm font-medium text-muted-foreground">
                รวมทุกงาน ไม่ได้แยกเฉพาะงานนี้
              </div>
            </div>
            <div className="w-full grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
              <div>
                <div className="text-muted-foreground">บัตรที่ถูกจอง</div>
                <div className="font-semibold">
                  {num(overview.totalTicketsSold)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">เช็กอินแล้ว</div>
                <div className="font-semibold">
                  {num(overview.totalCheckedIn)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">
                  ยอดออเดอร์ที่ชำระแล้ว
                </div>
                <div className="font-semibold">
                  {num(overview.totalTicketRevenue)} บาท
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">ยอดร้านค้า</div>
                <div className="font-semibold">
                  {num(overview.totalStoreVolume)}
                </div>
              </div>
            </div>
          </Badge>
        )}

        {/* ยอดขายบัตรรายประเภท */}
        <Badge
          variant={"outline"}
          className="p-4 w-full flex flex-col items-start gap-2 rounded-[10px]"
        >
          <div className="text-lg font-semibold">ยอดขายบัตรรายประเภท</div>
          <Table>
            <TableHeader className="bg-[#FAFAFA]">
              <TableRow>
                <TableHead>ประเภทบัตร</TableHead>
                <TableHead>ราคา</TableHead>
                <TableHead>ขายแล้ว / จำนวน</TableHead>
                <TableHead className="text-right">รายได้</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticketRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-20 text-center text-muted-foreground"
                  >
                    ยังไม่มีบัตร
                  </TableCell>
                </TableRow>
              ) : (
                ticketRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{num(r.price)} บาท</TableCell>
                    <TableCell>
                      {r.sold} / {r.quota}
                    </TableCell>
                    <TableCell className="text-right">
                      {num(r.revenue)} บาท
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Badge>

        {/* ยอดร้านค้ารายร้าน */}
        <Badge
          variant={"outline"}
          className="p-4 w-full flex flex-col items-start gap-2 rounded-[10px]"
        >
          <div className="text-lg font-semibold">รายงานรายร้าน</div>
          <Table>
            <TableHeader className="bg-[#FAFAFA]">
              <TableRow>
                <TableHead>ร้านค้า / สินค้า</TableHead>
                <TableHead>ราคา / หน่วย</TableHead>
                <TableHead className="text-right">ยอด Token คงเหลือ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {storeRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-20 text-center text-muted-foreground"
                  >
                    ยังไม่มีร้านค้า
                  </TableCell>
                </TableRow>
              ) : (
                storeRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {r.name}
                      {r.product ? ` / ${r.product}` : ""}
                    </TableCell>
                    <TableCell>
                      {r.price === null ? "-" : `${num(r.price)} Token`}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.balance === null ? "-" : `${num(r.balance)} Token`}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Badge>

        {/* export */}
        <Badge
          variant={"outline"}
          className="p-4 w-full flex flex-col items-start gap-2 rounded-[10px]"
        >
          <div className="text-[16px] font-semibold text-black">
            ชุดข้อมูลพร้อมส่งออก
          </div>
          <Table>
            <TableCaption>ส่งออกเป็นไฟล์ CSV (เปิดใน Excel ได้)</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ชุดรายงาน</TableHead>
                <TableHead>ข้อมูลสำคัญในไฟล์</TableHead>
                <TableHead>จำนวน</TableHead>
                <TableHead className="text-center">ดาวน์โหลด</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-[16px] font-medium">
                    {r.title}
                  </TableCell>
                  <TableCell className="text-[14px] font-medium text-muted-foreground">
                    {r.description}
                  </TableCell>
                  <TableCell>
                    {r.total} {r.unit}
                  </TableCell>
                  <TableCell>
                    <div className="w-full flex items-center justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-1 hover:bg-brand-hover hover:text-on-brand"
                        disabled={r.total === 0}
                        onClick={r.run}
                      >
                        <Download />
                        CSV
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Badge>
      </div>
    </div>
  );
}
