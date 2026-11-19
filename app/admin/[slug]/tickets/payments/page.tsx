"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import type { OrderDetail } from "@/lib/api-types";

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
type OrderStatus = OrderDetail["status"];

type OrderItem = {
  name: string;
  qty: number;
  unit: string;
  total: number;
};

type Participant = {
  id: string;
  name: string;
  gradYear: string | null;
  phone: string | null;
  email: string | null;
  ticketName: string;
  ticketPrice: number;
};

type Slip = {
  paymentSlip: string | null;
  hasPaymentSlip: boolean;
  amount: number;
  updatedAt: string;
};

type Order = {
  id: string;
  code: string;
  status: OrderStatus;
  hasPaymentSlip: boolean;
  total: number;
  createdAt: string;
  buyerName: string;
  buyerEmail: string;
  buyerGradYear: string | null;
  buyerPhone: string | null;
  items: OrderItem[];
  participants: Participant[];
  shirtDelivery: string;
  shirtAddress: string;
  slip: Slip;
};

// ---------- helpers ---------- //
const money = (n: number) => n.toLocaleString("th-TH");

const statusLabel: Record<OrderStatus, string> = {
  PENDING: "รอตรวจสอบ",
  PAID: "ชำระแล้ว",
  CANCELLED: "ยกเลิกแล้ว",
};

const statusClass: Record<OrderStatus, string> = {
  PENDING: "border-orange-300 bg-orange-50 text-orange-700",
  PAID: "border-green-300 bg-green-50 text-green-700",
  CANCELLED: "border-red-300 bg-red-50 text-red-700",
};

function StatusBadge({ order }: { order: Order }) {
  const { status, hasPaymentSlip } = order;
  return (
    <Badge
      variant="outline"
      className={`flex items-center justify-between gap-1 rounded-[10px] px-3 py-1.5 text-[14px] [&>svg]:size-4! ${statusClass[status]}`}
    >
      {status === "PENDING" && <Clock />}
      {status === "PAID" && <Check />}
      {status === "CANCELLED" && <X />}
      {status === "PENDING" && !hasPaymentSlip
        ? "รอชำระเงิน"
        : statusLabel[status]}
    </Badge>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function toOrder(order: OrderDetail): Order {
  const buyerTicket =
    order.tickets.find((ticket) => ticket.userId === order.userId) ??
    order.tickets[0];
  const buyerName = buyerTicket
    ? [buyerTicket.firstName, buyerTicket.lastName].filter(Boolean).join(" ")
    : "";
  const ticketItems = new Map<
    string,
    { name: string; qty: number; total: number }
  >();

  for (const ticket of order.tickets) {
    const name = ticket.ticketTypeName ?? "บัตร";
    const key = `${ticket.eventTicketId}:${ticket.unitPrice}`;
    const item = ticketItems.get(key);
    if (item) {
      item.qty += 1;
      item.total += Number(ticket.unitPrice);
    } else {
      ticketItems.set(key, {
        name,
        qty: 1,
        total: Number(ticket.unitPrice),
      });
    }
  }

  const items: OrderItem[] = [...ticketItems.values()].map((item) => ({
    ...item,
    unit: "ใบ",
  }));
  for (const souvenir of order.souvenirItems) {
    items.push({
      name: souvenir.size
        ? `${souvenir.name} (${souvenir.size})`
        : souvenir.name,
      qty: souvenir.quantity,
      unit: "ชิ้น",
      total: Number(souvenir.unitPrice) * souvenir.quantity,
    });
  }
  if (Number(order.shippingFee) > 0) {
    items.push({
      name: "ค่าจัดส่ง",
      qty: 1,
      unit: "ครั้ง",
      total: Number(order.shippingFee),
    });
  }

  const shipping = order.shipping;
  const address = shipping
    ? [
        shipping.recipientName,
        shipping.recipientPhone,
        shipping.addressLine,
        shipping.subDistrict,
        shipping.district,
        shipping.province,
        shipping.postalCode,
      ]
        .filter(Boolean)
        .join(" ")
    : "-";

  return {
    id: order.id,
    code: order.orderNo,
    status: order.status,
    hasPaymentSlip: order.hasPaymentSlip,
    total: Number(order.total),
    createdAt: formatDateTime(order.createdAt),
    buyerName: buyerName || "ผู้ซื้อ",
    buyerEmail: buyerTicket?.email ?? "-",
    buyerGradYear: buyerTicket?.graduationYear ?? null,
    buyerPhone: buyerTicket?.phone ?? null,
    items,
    participants: order.tickets.map((ticket) => ({
      id: ticket.id,
      name:
        [ticket.firstName, ticket.lastName].filter(Boolean).join(" ") ||
        "ไม่ระบุชื่อ",
      gradYear: ticket.graduationYear,
      phone: ticket.phone,
      email: ticket.email,
      ticketName: ticket.ticketTypeName ?? "บัตร",
      ticketPrice: Number(ticket.unitPrice),
    })),
    shirtDelivery:
      order.deliveryMethod === "SHIPPING"
        ? "จัดส่ง"
        : order.deliveryMethod === "PICKUP"
          ? "รับหน้างาน"
          : "ไม่มีของที่ระลึก",
    shirtAddress: address,
    slip: {
      paymentSlip: order.paymentSlip,
      hasPaymentSlip: order.hasPaymentSlip,
      amount: Number(order.total),
      updatedAt: formatDateTime(order.paidAt ?? order.updatedAt),
    },
  };
}

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
  const { slug } = useParams<{ slug: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [index, setIndex] = useState(0);
  const [slipOpen, setSlipOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      setLoading(true);
      setError(null);

      const eventResult = await api.events.get(slug);
      if (!active) return;
      if (!eventResult.success) {
        setError(eventResult.error.message);
        setLoading(false);
        return;
      }

      setEventTitle(eventResult.data.title);
      const ordersResult = await api.orders.listMy();
      if (!active) return;
      if (!ordersResult.success) {
        setError(ordersResult.error.message);
        setLoading(false);
        return;
      }

      setOrders(
        ordersResult.data
          .filter((order) => order.eventId === eventResult.data.id)
          .map(toOrder),
      );
      setLoading(false);
    }

    void loadOrders();
    return () => {
      active = false;
    };
  }, [slug]);

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

  const pendingCount = orders.filter(
    (order) => order.status === "PENDING" && order.hasPaymentSlip,
  ).length;

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

  return (
    <div className="p-4 w-full flex mx-auto flex-col items-start justify-center">
      {/* Breadcrumbs */}
      <div className="w-full flex items-center justify-start">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/admin/${slug}`}>
                {eventTitle}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/admin/${slug}/tickets`}>
                บัตรและเสื้อ
              </BreadcrumbLink>
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
            <Link href={`/admin/${slug}/tickets`}>
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
              placeholder="ค้นหารหัสคำสั่งซื้อ หรือชื่อผู้ร่วมงาน"
              className="h-auto py-3 pl-9 font-light"
            />
          </div>
          {current && <StatusBadge order={current} />}
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

        {loading && (
          <div className="w-full rounded-[10px] border p-10 text-center text-muted-foreground">
            กำลังโหลดคำสั่งซื้อ...
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="w-full rounded-[10px] border border-destructive/30 bg-destructive/5 p-4 text-destructive"
          >
            โหลดคำสั่งซื้อไม่สำเร็จ: {error}
          </div>
        )}

        {!loading && !error && !current && (
          <div className="w-full rounded-[10px] border p-10 text-center text-muted-foreground">
            {keyword
              ? "ไม่พบคำสั่งซื้อที่ค้นหา"
              : "บัญชีนี้ยังไม่มีคำสั่งซื้อในงานนี้"}
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
                {current.slip.paymentSlip ? (
                  <Image
                    src={current.slip.paymentSlip}
                    alt={`หลักฐานการชำระเงิน ${current.code}`}
                    width={960}
                    height={720}
                    unoptimized
                    className="max-h-96 w-full rounded-md object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                    <FileCheck className="size-10" />
                    <div className="font-medium">
                      {current.slip.hasPaymentSlip
                        ? "มีสลิปแนบ แต่ API ไม่ส่งรูปหลักฐานกลับมา"
                        : "ยังไม่มีหลักฐานการชำระเงิน"}
                    </div>
                  </div>
                )}
                <div className="text-3xl font-semibold tabular-nums">
                  {current.slip.amount.toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  บาท
                </div>
                <div className="text-sm text-muted-foreground">
                  อัปเดตล่าสุด {current.slip.updatedAt}
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  ออเดอร์ {current.code}
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-[10px]"
                onClick={() => setSlipOpen(true)}
                disabled={!current.slip.paymentSlip}
              >
                <Maximize2 />
                ขยายหลักฐาน
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
                <StatusBadge order={current} />
              </div>

              <div className="w-full flex flex-col gap-2">
                <InfoRow
                  label="ผู้ร่วมงาน / อีเมล"
                  value={`${current.buyerName} / ${current.buyerEmail}`}
                />
                <InfoRow
                  label="ปีการศึกษา / โทรศัพท์"
                  value={`${current.buyerGradYear ?? "-"} / ${current.buyerPhone ?? "-"}`}
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
                  {current.items.map((item, itemIndex) => (
                    <TableRow key={`${item.name}-${itemIndex}`}>
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
                  {money(current.total)} บาท
                </div>
              </div>

              {/* ผู้เข้าร่วมแยกตามบัตร */}
              <div className="w-full flex flex-col gap-3">
                <div className="font-semibold">ผู้เข้าร่วมแยกตามบัตร</div>
                {current.participants.map((p) => (
                  <div key={p.id} className="flex flex-col gap-0.5">
                    <div className="font-semibold">
                      {p.name}
                      {p.gradYear ? ` ปีการศึกษา ${p.gradYear}` : ""}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {p.phone ?? "-"} • {p.email ?? "-"} • {p.ticketName}{" "}
                      {money(p.ticketPrice)} บาท
                    </div>
                  </div>
                ))}
              </div>

              {/* การรับของที่ระลึก */}
              <div className="w-full flex flex-col gap-2 border-t pt-3">
                <InfoRow
                  label="การรับของที่ระลึก"
                  value={current.shirtDelivery}
                />
                <div className="text-sm font-medium">
                  {current.shirtAddress}
                </div>
              </div>
            </Badge>
          </div>
        )}

        {/* dialog ขยายหลักฐาน */}
        <Dialog open={slipOpen} onOpenChange={setSlipOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>หลักฐานการชำระเงิน</DialogTitle>
              <DialogDescription>
                {current ? `ออเดอร์ ${current.code}` : ""}
              </DialogDescription>
            </DialogHeader>

            {current?.slip.paymentSlip ? (
              <div className="w-full flex flex-col items-center gap-3 py-2">
                <Image
                  src={current.slip.paymentSlip}
                  alt={`หลักฐานการชำระเงิน ${current.code}`}
                  width={960}
                  height={720}
                  unoptimized
                  className="max-h-[70vh] w-full rounded-md object-contain"
                />
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                API ไม่ได้ส่งรูปหลักฐานกลับมา
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
