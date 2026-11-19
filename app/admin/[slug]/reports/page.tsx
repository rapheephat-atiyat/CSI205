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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// icon
import { Download } from "lucide-react";

import { api } from "@/lib/api-client";
import type {
  EventDetail,
  StoreDetail,
} from "@/lib/api-types";

type Cell = string | number | null | undefined;

const num = (v?: string | number | null) =>
  v === null || v === undefined ? "-" : Number(v).toLocaleString("th-TH");

export default function Page() {
  const [downLoadFinish, setDownLoadFinish] = useState(false);
  const { slug } = useParams<{ slug: string }>();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [stores, setStores] = useState<
    { id: string; name: string; detail: StoreDetail | null }[]
  >([]);
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

      const storeRes = await Promise.all(
        ev.stores.map((s) => api.store.getMy(s.id)),
      );
      setStores(
        ev.stores.map((s, i) => ({
          id: s.id,
          name: s.name,
          detail: storeRes[i].success ? storeRes[i].data : null,
        })),
      );
      setLoading(false);
    }
    load();
  }, [slug]);

  const ticketRows = (event?.tickets ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    price: Number(t.price),
    sold: t.sold,
    quota: t.quota,
    revenue: Number(t.price) * t.sold,
  }));
  const totalSold = ticketRows.reduce((s, r) => s + r.sold, 0);
  const totalRevenue = ticketRows.reduce((s, r) => s + r.revenue, 0);

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
      description: "ประเภทบัตร / ราคา / ขายแล้ว / จำนวนทั้งหมด / รายได้",
      total: ticketRows.length,
      unit: "ประเภท",
      file: `${slug}-tickets`,
      rows: [
        ["ประเภทบัตร", "ราคา (บาท)", "ขายแล้ว", "จำนวนทั้งหมด", "รายได้ (บาท)"],
        ...ticketRows.map((r) => [r.name, r.price, r.sold, r.quota, r.revenue]),
      ] as Cell[][],
    },
    {
      id: "stores",
      title: "รายงานร้านค้า",
      description: "ร้านค้า / สินค้า / ราคา / ยอด Token คงเหลือ",
      total: storeRows.length,
      unit: "ร้าน",
      file: `${slug}-stores`,
      rows: [
        ["ร้านค้า", "สินค้า", "ราคา (Token)", "ยอด Token คงเหลือ"],
        ...storeRows.map((r) => [r.name, r.product, r.price, r.balance]),
      ] as Cell[][],
    },
  ];

  useEffect(() => {
    if (!downLoadFinish) return;

    toast.success("โหลดไฟล์สำเร็จ", {
      position: "bottom-right",
      className: "text-green-400!",
    });

    setDownLoadFinish(false);
  }, [downLoadFinish]);

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
    setTimeout(() => {
      setDownLoadFinish(true);
    }, 3000);
  }

  async function downloadXlsx(
    filename: string,
    rows: Cell[][],
    sheetName: string,
  ) {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(sheetName.slice(0, 31));

    ws.addRows(rows.map((r) => r.map((v) => v ?? "")));

    ws.getRow(1).font = { bold: true };
    ws.views = [{ state: "frozen", ySplit: 1 }];
    ws.columns.forEach((col, i) => {
      const longest = Math.max(
        ...rows.map((r) => String(r[i] ?? "").length),
        8,
      );
      col.width = Math.min(longest + 2, 50);
    });

    const buffer = await wb.xlsx.writeBuffer();
    const url = URL.createObjectURL(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setDownLoadFinish(true);
  }

  if (loading) {
    return (
      <div className="p-4 w-full flex mx-auto flex-col items-start justify-center">
        {/* breadcrumb */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24 bg-on-brand" />
          <Skeleton className="h-4 w-4 bg-on-brand" />
          <Skeleton className="h-4 w-32 bg-on-brand" />
        </div>

        <div className="p-4 mx-auto w-full max-w-7xl flex flex-col gap-4">
          {/* หัวเรื่อง */}
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-48 bg-on-brand" />
            <Skeleton className="h-4 w-80 max-w-full bg-on-brand" />
          </div>

          {/* การ์ดสรุป 2 ใบ */}
          <div className="w-full grid grid-cols-1 gap-3 md:grid-cols-2">
            <Skeleton className="h-36 w-full rounded-[10px] bg-on-brand" />
            <Skeleton className="h-36 w-full rounded-[10px] bg-on-brand" />
          </div>

          {/* ตารางบัตร / ร้านค้า / ส่งออก */}
          <Skeleton className="h-56 w-full rounded-[10px] bg-on-brand" />
          <Skeleton className="h-56 w-full rounded-[10px] bg-on-brand" />
          <Skeleton className="h-48 w-full rounded-[10px] bg-on-brand" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return <div className="p-4">{error ?? "ไม่พบงาน"}</div>;
  }

  return (
    <div className="p-4 w-full flex mx-auto flex-col items-start justify-center">
      <div className="w-full flex items-center justify-start">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/admin/${slug}`}>
                {event?.title}
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
              <div className="text-lg font-semibold">บัตร</div>
            </div>
            <div className="w-full flex items-center justify-between text-sm">
              <div className="text-muted-foreground">ขายแล้วทั้งหมด</div>
              <div>{num(totalSold)} ใบ</div>
            </div>
            <div className="w-full border"></div>
            <div className="w-full flex items-center justify-between text-sm">
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
            <TableCaption>เลือกส่งออกข้อมูลรูปแบบ CSV หรือ XLSX</TableCaption>
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
                    <div className="w-full flex items-center justify-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-1 hover:bg-brand-hover hover:text-on-brand cursor-pointer"
                        disabled={r.total === 0}
                        onClick={() => downloadCsv(`${r.file}.csv`, r.rows)}
                      >
                        <Download />
                        CSV
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-1 hover:bg-brand-hover hover:text-on-brand cursor-pointer"
                        disabled={r.total === 0}
                        onClick={() =>
                          downloadXlsx(`${r.file}.xlsx`, r.rows, r.title).catch(
                            () => toast.error("ส่งออก XLSX ไม่สำเร็จ"),
                          )
                        }
                      >
                        <Download />
                        XLSX
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
