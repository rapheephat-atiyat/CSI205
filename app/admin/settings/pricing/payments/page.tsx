"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

// import icons
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  FileCheck,
  Maximize2,
  Search,
  X,
} from "lucide-react";

// import ui
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ---------- types ---------- //
type OrderStatus = "pending" | "approved" | "rejected";

type OrderItem = {
  name: string;
  qty: number;
  unit: string;
  total: number;
};

type Participant = {
  name: string;
  gradYear: number;
  phone: string;
  email: string;
  ticketName: string;
  ticketPrice: number;
};

type Slip = {
  fileName: string;
  attachedAt: string;
  amount: number;
  paidAt: string;
  fromName: string;
  fromAccount: string;
  toName: string;
  toAccount: string;
  reference: string;
};

type Order = {
  id: string;
  code: string;
  status: OrderStatus;
  createdAt: string;
  buyerName: string;
  buyerEmail: string;
  buyerGradYear: number;
  buyerPhone: string;
  items: OrderItem[];
  participants: Participant[];
  shirtDelivery: string;
  shirtAddress: string;
  slip: Slip;
};

// ---------- sample data ---------- //
const initialOrders: Order[] = [
  {
    id: "order-1",
    code: "RE2569-1048",
    status: "pending",
    createdAt: "28 พ.ย. 2569 เวลา 17:10 น.",
    buyerName: "กิตติพงษ์ ใจดี",
    buyerEmail: "kitti@example.com",
    buyerGradYear: 2548,
    buyerPhone: "081-234-5678",
    items: [
      { name: "บัตรสนับสนุน · รวม 50 Token", qty: 1, unit: "ใบ", total: 1000 },
      { name: "บัตรสัมพันธ์ · รวม 10 Token", qty: 1, unit: "ใบ", total: 500 },
      { name: "เสื้อที่ระลึก M × 1, L × 1", qty: 2, unit: "ตัว", total: 600 },
    ],
    participants: [
      {
        name: "กิตติพงษ์ ใจดี",
        gradYear: 2548,
        phone: "081-234-5678",
        email: "kitti@example.com",
        ticketName: "บัตรสนับสนุน",
        ticketPrice: 1000,
      },
      {
        name: "ณัฐพร วัฒนกุล",
        gradYear: 2549,
        phone: "089-456-1234",
        email: "nattaporn@example.com",
        ticketName: "บัตรสัมพันธ์",
        ticketPrice: 500,
      },
    ],
    shirtDelivery: "จัดส่งรวม • ใช้ที่อยู่ใหม่",
    shirtAddress: "99/12 ซอยรัชดาภิเษก 3 แขวงสามเสนใน เขตพญาไท กรุงเทพฯ 10400",
    slip: {
      fileName: "slip-RE2569-1048.jpg",
      attachedAt: "แนบ 17:14 น.",
      amount: 2100,
      paidAt: "28 พ.ย. 2569 เวลา 17:12 น.",
      fromName: "กิตติพงษ์ ใจดี",
      fromAccount: "xxx-x-x4321-x",
      toName: "สมาคมศิษย์เก่า",
      toAccount: "xxx-x-x6789-x",
      reference: "SAMPLE-THQR-112801",
    },
  },
  {
    id: "order-2",
    code: "RE2569-1049",
    status: "pending",
    createdAt: "28 พ.ย. 2569 เวลา 18:02 น.",
    buyerName: "ปวีณา สุขใจ",
    buyerEmail: "paweena@example.com",
    buyerGradYear: 2551,
    buyerPhone: "086-111-2233",
    items: [
      { name: "บัตรสัมพันธ์ · รวม 10 Token", qty: 2, unit: "ใบ", total: 1000 },
    ],
    participants: [
      {
        name: "ปวีณา สุขใจ",
        gradYear: 2551,
        phone: "086-111-2233",
        email: "paweena@example.com",
        ticketName: "บัตรสัมพันธ์",
        ticketPrice: 500,
      },
      {
        name: "ธนากร สุขใจ",
        gradYear: 2551,
        phone: "086-111-2244",
        email: "thanakorn@example.com",
        ticketName: "บัตรสัมพันธ์",
        ticketPrice: 500,
      },
    ],
    shirtDelivery: "ไม่มีเสื้อในคำสั่งซื้อนี้",
    shirtAddress: "-",
    slip: {
      fileName: "slip-RE2569-1049.jpg",
      attachedAt: "แนบ 18:05 น.",
      amount: 1000,
      paidAt: "28 พ.ย. 2569 เวลา 18:04 น.",
      fromName: "ปวีณา สุขใจ",
      fromAccount: "xxx-x-x1188-x",
      toName: "สมาคมศิษย์เก่า",
      toAccount: "xxx-x-x6789-x",
      reference: "SAMPLE-THQR-112802",
    },
  },
  {
    id: "order-3",
    code: "RE2569-1050",
    status: "pending",
    createdAt: "29 พ.ย. 2569 เวลา 09:40 น.",
    buyerName: "สมชาย รักเรียน",
    buyerEmail: "somchai@example.com",
    buyerGradYear: 2545,
    buyerPhone: "082-999-0000",
    items: [
      { name: "บัตรสนับสนุน · รวม 50 Token", qty: 1, unit: "ใบ", total: 1000 },
      { name: "เสื้อที่ระลึก XL × 1", qty: 1, unit: "ตัว", total: 300 },
    ],
    participants: [
      {
        name: "สมชาย รักเรียน",
        gradYear: 2545,
        phone: "082-999-0000",
        email: "somchai@example.com",
        ticketName: "บัตรสนับสนุน",
        ticketPrice: 1000,
      },
    ],
    shirtDelivery: "รับหน้างาน",
    shirtAddress: "-",
    slip: {
      fileName: "slip-RE2569-1050.jpg",
      attachedAt: "แนบ 09:43 น.",
      amount: 1300,
      paidAt: "29 พ.ย. 2569 เวลา 09:41 น.",
      fromName: "สมชาย รักเรียน",
      fromAccount: "xxx-x-x7755-x",
      toName: "สมาคมศิษย์เก่า",
      toAccount: "xxx-x-x6789-x",
      reference: "SAMPLE-THQR-112803",
    },
  },
];

// ---------- helpers ---------- //
const money = (n: number) => n.toLocaleString("th-TH");

const statusLabel: Record<OrderStatus, string> = {
  pending: "รอตรวจสอบ",
  approved: "อนุมัติแล้ว",
  rejected: "ไม่อนุมัติ",
};

const statusClass: Record<OrderStatus, string> = {
  pending: "border-orange-300 bg-orange-50 text-orange-700",
  approved: "border-green-300 bg-green-50 text-green-700",
  rejected: "border-red-300 bg-red-50 text-red-700",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge
      variant="outline"
      className={`flex items-center justify-between gap-1 rounded-[10px] px-3 py-1.5 text-[14px] [&>svg]:size-4! ${statusClass[status]}`}
    >
      {status === "pending" && <Clock />}
      {status === "approved" && <Check />}
      {status === "rejected" && <X />}
      {statusLabel[status]}
    </Badge>
  );
}

// แถว "ชื่อ — ค่า" ที่ใช้ซ้ำหลายที่
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex w-full items-start justify-between gap-4">
      <div className="text-sm text-muted-foreground md:text-[16px]">
        {label}
      </div>
      <div className="text-right text-sm md:text-[16px]">{value}</div>
    </div>
  );
}

export default function Page() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [keyword, setKeyword] = useState("");
  const [index, setIndex] = useState(0);
  const [slipOpen, setSlipOpen] = useState(false);

  // กรองตามรหัสคำสั่งซื้อหรือชื่อผู้ซื้อ
  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return orders;
    return orders.filter(
      (o) =>
        o.code.toLowerCase().includes(k) ||
        o.buyerName.toLowerCase().includes(k),
    );
  }, [orders, keyword]);

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  // กัน index เกินช่วงเมื่อผลค้นหาเปลี่ยน
  const safeIndex =
    filtered.length === 0 ? 0 : Math.min(index, filtered.length - 1);
  const current: Order | undefined = filtered[safeIndex];

  function handleSearch(value: string) {
    setKeyword(value);
    setIndex(0);
  }

  function goNext() {
    if (filtered.length === 0) return;
    setIndex((safeIndex + 1) % filtered.length);
  }

  function setStatus(id: string, status: OrderStatus) {
    setOrders((pre) => pre.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  return (
    <div className="p-4 w-full flex mx-auto flex-col items-start justify-center">
      {/* Breadcrumbs */}
      <div className="w-full flex items-center justify-start">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">ส่วนกลาง</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/settings/pricing">บัตรและเสื้อ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>ตรวจสอบการชำระเงิน</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="p-4 mx-auto w-full max-w-7xl flex flex-col items-start justify-center gap-4">
        {/* หัวเรื่อง + ปุ่มกลับ */}
        <div className="w-full flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col items-start justify-center">
            <div className="text-[24px] font-semibold text-black">
              ตรวจสอบการชำระเงิน
            </div>
            <div className="text-[14px] font-medium text-muted-foreground">
              บัตรและเสื้อ / คิวรอตรวจ {pendingCount} คำสั่งซื้อ
            </div>
          </div>
          <Button asChild variant="outline" className="rounded-[10px]">
            <Link href="/admin/settings/pricing">
              <ArrowLeft />
              กลับไปคิวรายการ
            </Link>
          </Button>
        </div>

        {/* ค้นหา + สถานะ + รายการถัดไป */}
        <div className="w-full flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="ค้นหารหัสคำสั่งซื้อ หรือชื่อผู้ซื้อ"
              className="h-auto py-3 pl-9 font-light"
            />
          </div>
          {current && <StatusBadge status={current.status} />}
          <Button
            type="button"
            variant="outline"
            onClick={goNext}
            disabled={filtered.length <= 1}
            className="rounded-[10px]"
          >
            <ChevronRight />
            รายการถัดไป
          </Button>
        </div>

        {/* ไม่พบรายการ */}
        {!current && (
          <div className="w-full rounded-[10px] border p-10 text-center text-muted-foreground">
            ไม่พบคำสั่งซื้อที่ค้นหา
          </div>
        )}

        {current && (
          <div className="w-full grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            {/* ซ้าย: หลักฐานการโอน */}
            <Badge
              variant={"outline"}
              className="p-4 flex flex-col items-start justify-start w-full h-auto rounded-[10px] gap-3.5"
            >
              <div className="w-full flex flex-col items-start gap-1">
                <div className="text-lg font-semibold text-black">
                  หลักฐานการโอนเงิน
                </div>
                <div className="text-sm text-muted-foreground">
                  ThaiQR / โอนผ่านธนาคาร
                </div>
              </div>

              <div className="w-full rounded-[10px] border bg-muted/30 p-5 flex flex-col items-center gap-3">
                <FileCheck className="size-10 text-muted-foreground" />
                <div className="text-lg font-semibold">หลักฐานตัวอย่าง</div>
                <Badge
                  variant="outline"
                  className="rounded-[10px] bg-background px-3 py-1.5 text-[13px]"
                >
                  SAMPLE • ไม่ใช่สลิปจริง
                </Badge>
                <div className="text-4xl font-semibold tabular-nums">
                  {current.slip.amount.toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <div className="text-sm text-muted-foreground">
                  บาท • {current.slip.paidAt}
                </div>

                <div className="my-1 w-full border-t" />

                <InfoRow label="จาก" value={current.slip.fromName} />
                <InfoRow label="บัญชีต้นทาง" value={current.slip.fromAccount} />
                <InfoRow label="ถึง" value={current.slip.toName} />
                <InfoRow label="บัญชีปลายทาง" value={current.slip.toAccount} />

                <div className="my-1 w-full border-t" />

                <div className="text-center text-xs text-muted-foreground">
                  <div>อ้างอิง {current.slip.reference}</div>
                  <div>ไม่ใช่ QR สำหรับชำระเงิน</div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                {current.slip.fileName} • {current.slip.attachedAt}
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-[10px]"
                onClick={() => setSlipOpen(true)}
              >
                <Maximize2 />
                ขยายหลักฐานตัวอย่าง
              </Button>
            </Badge>

            {/* ขวา: รายละเอียดคำสั่งซื้อ */}
            <Badge
              variant={"outline"}
              className="p-4 flex flex-col items-start justify-start w-full h-auto rounded-[10px] gap-4"
            >
              <div className="w-full flex items-start justify-between gap-2">
                <div className="flex flex-col items-start gap-1">
                  <div className="text-lg font-semibold text-black">
                    คำสั่งซื้อ {current.code}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    สร้าง {current.createdAt}
                  </div>
                </div>
                <StatusBadge status={current.status} />
              </div>

              <div className="w-full flex flex-col gap-2">
                <InfoRow
                  label="ผู้ซื้อ / อีเมลรับ QR"
                  value={`${current.buyerName} / ${current.buyerEmail}`}
                />
                <InfoRow
                  label="ปีที่เข้าศึกษา / โทรศัพท์"
                  value={`${current.buyerGradYear} / ${current.buyerPhone}`}
                />
              </div>

              {/* รายการสั่งซื้อ */}
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-muted-foreground">
                      รายการ
                    </TableHead>
                    <TableHead className="text-right text-muted-foreground">
                      จำนวน
                    </TableHead>
                    <TableHead className="text-right text-muted-foreground">
                      รวม
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {current.items.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">
                        {item.qty} {item.unit}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {money(item.total)} บาท
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="w-full flex items-center justify-between border-b pb-3">
                <div className="text-sm text-muted-foreground md:text-[16px]">
                  ยอดที่ต้องชำระทั้งหมด
                </div>
                <div className="text-sm font-semibold tabular-nums md:text-[16px]">
                  {money(current.items.reduce((sum, i) => sum + i.total, 0))}{" "}
                  บาท
                </div>
              </div>

              {/* ผู้เข้าร่วมแยกตามบัตร */}
              <div className="w-full flex flex-col gap-3">
                <div className="font-semibold">ผู้เข้าร่วมแยกตามบัตร</div>
                {current.participants.map((p) => (
                  <div key={p.email} className="flex flex-col gap-0.5">
                    <div className="font-semibold">
                      {p.name} • เข้าศึกษา พ.ศ. {p.gradYear}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {p.phone} • {p.email} • {p.ticketName}{" "}
                      {money(p.ticketPrice)} บาท
                    </div>
                  </div>
                ))}
              </div>

              {/* การรับเสื้อ */}
              <div className="w-full flex flex-col gap-2 border-t pt-3">
                <InfoRow label="การรับเสื้อ" value={current.shirtDelivery} />
                <div className="text-sm font-medium">
                  {current.shirtAddress}
                </div>
              </div>

              {/* อนุมัติ / ไม่อนุมัติ */}
              <div className="w-full flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
                {current.status !== "pending" && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStatus(current.id, "pending")}
                  >
                    ย้อนกลับเป็นรอตรวจสอบ
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  disabled={current.status === "rejected"}
                  onClick={() => setStatus(current.id, "rejected")}
                  className="rounded-[10px] border-red-300 text-red-700 hover:bg-red-50"
                >
                  <X />
                  ไม่อนุมัติ
                </Button>
                <Button
                  type="button"
                  disabled={current.status === "approved"}
                  onClick={() => setStatus(current.id, "approved")}
                  className="rounded-[10px] bg-brand hover:bg-brand-hover"
                >
                  <Check />
                  อนุมัติการชำระเงิน
                </Button>
              </div>
            </Badge>
          </div>
        )}

        {/* dialog ขยายหลักฐาน */}
        <Dialog open={slipOpen} onOpenChange={setSlipOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>หลักฐานตัวอย่าง</DialogTitle>
              <DialogDescription>
                {current?.slip.fileName} • ข้อมูลตัวอย่าง ไม่ใช่สลิปจริง
              </DialogDescription>
            </DialogHeader>

            {current && (
              <div className="w-full flex flex-col items-center gap-3 py-2">
                <FileCheck className="size-14 text-muted-foreground" />
                <div className="text-4xl font-semibold tabular-nums">
                  {current.slip.amount.toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <div className="text-sm text-muted-foreground">
                  บาท • {current.slip.paidAt}
                </div>
                <div className="my-1 w-full border-t" />
                <InfoRow label="จาก" value={current.slip.fromName} />
                <InfoRow label="บัญชีต้นทาง" value={current.slip.fromAccount} />
                <InfoRow label="ถึง" value={current.slip.toName} />
                <InfoRow label="บัญชีปลายทาง" value={current.slip.toAccount} />
                <div className="text-xs text-muted-foreground">
                  อ้างอิง {current.slip.reference}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
