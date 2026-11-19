"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Users,
  LucideIcon,
  ScanLine,
  Ticket,
  Coins,
  SquareArrowOutUpRight,
  ClipboardCheck,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { EventDetail } from "@/lib/api-types";
import { Skeleton } from "@/components/ui/skeleton";

type Stat = {
  icon: LucideIcon;
  label: string;
  value: string;
  unit: string;
};

export default function AdminDashboardPage() {
  const { slug } = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<EventDetail["stores"]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      setEvent(null);
      setStores([]);

      const res = await api.events.get(`${slug}`);
      if (!active) return;
      if (!res.success) {
        setError(res.error.message);
        setLoading(false);
        return;
      }

      setEvent(res.data);
      setStores(res.data.stores);
      setLoading(false);
    }
    load();

    return () => {
      active = false;
    };
  }, [slug]);

  const styles = {
    text: "text-muted-foreground text-sm font-light",
  };
  const totalBookedTickets = event
    ? event.tickets.reduce((total, ticket) => total + ticket.sold, 0)
    : null;
  const bookedTicketValue = event
    ? event.tickets.reduce(
        (total, ticket) => total + Number(ticket.price) * ticket.sold,
        0,
      )
    : null;
  const unavailableValue = error ? "—" : "0";

  const stats: Stat[] = [
    {
      icon: Users,
      label: "จำนวนบัตรที่ถูกจอง",
      value: totalBookedTickets?.toLocaleString("th-TH") ?? unavailableValue,
      unit: "ใบ",
    },
    {
      icon: ScanLine,
      label: "จำนวนเช็กอิน",
      value: unavailableValue,
      unit: "คน",
    },
    {
      icon: Ticket,
      label: "มูลค่าบัตรที่ถูกจอง",
      value: bookedTicketValue?.toLocaleString("th-TH") ?? unavailableValue,
      unit: "บาท",
    },
    {
      icon: Coins,
      label: "ยอดร้านค้า",
      value: unavailableValue,
      unit: "Token",
    },
  ];

  if (loading)
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

          {/* การ์ด 4 ใบ */}
          <div className="w-full grid grid-cols-4 gap-4">
            <Skeleton className="w-auto h-40 rounded-[10px] bg-on-brand" />
            <Skeleton className="w-auto h-40 rounded-[10px] bg-on-brand" />
            <Skeleton className="w-auto h-40 rounded-[10px] bg-on-brand" />
            <Skeleton className="w-auto h-40 rounded-[10px] bg-on-brand" />
          </div>

          {/* การ์ด 2 ใบ */}
          <div className="w-full flex flex-row gap-4">
            <Skeleton className="w-full flex-2 h-100 rounded-[10px] bg-on-brand" />
            <Skeleton className="w-full flex-1 h-100 rounded-[10px] bg-on-brand" />
          </div>

          {/* การ์ด 2 ใบ */}
          <div className="w-full flex flex-row gap-4">
            <Skeleton className="w-full h-100 rounded-[10px] bg-on-brand" />
          </div>
        </div>
      </div>
    );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:p-6 lg:scrollbar-none">
      {/* Breadcrumbs */}
      <div className="w-full flex items-center justify-start">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{event?.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      {/* header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-black sm:text-2xl">
          ภาพรวมงาน
        </h1>
        <p className={cn(styles.text, "text-xs sm:text-sm")}>
          ติดตามการลงทะเบียน การเข้างาน และยอดขายของ{" "}
          <span>{event?.title ?? "งานนี้"}</span>
        </p>
      </div>
      {error && (
        <div role="alert" className="text-sm text-destructive">
          {error}
        </div>
      )}

      {/* event detail cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {stats.map((item) => (
          <Badge
            key={item.label}
            variant="outline"
            className="flex h-auto w-full flex-col items-start justify-between gap-2 rounded-[10px] p-4 text-left whitespace-normal lg:p-6"
          >
            <div
              className={cn(
                styles.text,
                "text-xs sm:text-sm w-full flex items-center justify-between",
              )}
            >
              {item.label}
              <item.icon className="hidden text-brand md:flex size-7" />
            </div>
            <div
              className={cn(
                styles.text,
                "text-2xl font-semibold text-black md:text-3xl lg:text-4xl",
              )}
            >
              {item.value}
            </div>
            <div className={cn(styles.text, "text-xs text-black sm:text-sm")}>
              {item.unit}
            </div>
          </Badge>
        ))}
      </div>
      <Badge
        variant="outline"
        className="flex h-auto w-full flex-col items-start gap-3 rounded-[10px] p-4"
      >
        <div className="flex w-full items-center justify-between gap-3">
          <div className="text-lg font-semibold text-black">
            ประเภทบัตรในงาน
          </div>
          <Link
            href={`/admin/${slug}/tickets`}
            className="text-sm font-medium text-brand hover:underline"
          >
            จัดการบัตร
          </Link>
        </div>
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#FAFAFA]">
              <TableRow>
                <TableHead>ประเภทบัตร</TableHead>
                <TableHead>ราคา</TableHead>
                <TableHead>จองแล้ว / โควตา</TableHead>
                <TableHead>คงเหลือ</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!event?.tickets.length ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-20 text-center text-muted-foreground"
                  >
                    {error ? "โหลดข้อมูลบัตรไม่สำเร็จ" : "0 ประเภทบัตร"}
                  </TableCell>
                </TableRow>
              ) : (
                event.tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.name}</TableCell>
                    <TableCell>
                      {Number(ticket.price).toLocaleString("th-TH")} บาท
                    </TableCell>
                    <TableCell>
                      {ticket.sold.toLocaleString("th-TH")} /{" "}
                      {ticket.quota.toLocaleString("th-TH")}
                    </TableCell>
                    <TableCell>
                      {Math.max(ticket.quota - ticket.sold, 0).toLocaleString(
                        "th-TH",
                      )}
                    </TableCell>
                    <TableCell>
                      {ticket.isActive ? "เปิดขาย" : "ปิดขาย"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Badge>
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* enter event */}
        <div className="mx-auto flex w-full lg:flex-2">
          <Badge
            variant={"outline"}
            className="p-4 flex h-auto w-full flex-col items-start justify-between gap-2 rounded-[10px]"
          >
            <div className={cn(styles.text, "text-xs sm:text-sm")}>
              การเข้างานสะสม
            </div>
            <div
              className={cn(
                styles.text,
                "text-2xl font-semibold text-black md:text-3xl lg:text-4xl",
              )}
            >
              {unavailableValue} /{" "}
              {totalBookedTickets?.toLocaleString("th-TH") ?? unavailableValue}
              <span className="lg:text-2xl"> คน</span>
            </div>
            <div className="hidden w-full flex-col gap-4 md:flex">
              <div className="w-full flex items-start justify-between">
                <div className="text-lg text-muted-foreground font-semibold">
                  ยังไม่เช็กอิน
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="text-lg font-semibold">
                    {unavailableValue}
                  </div>
                </div>
              </div>
            </div>
            {/* Mobile */}
            <div className="w-full flex flex-col items-start justify-center gap-2 md:hidden">
              <div className={"w-full flex items-start justify-between"}>
                <div className={cn(styles.text)}>เช็กอินแล้ว</div>
                <div className={cn(styles.text, "font-bold text-black")}>
                  {unavailableValue}
                </div>
              </div>
              <div className={"w-full flex items-start justify-between"}>
                <div className={cn(styles.text)}>ยังไม่เช็กอิน</div>
                <div
                  className={cn(styles.text, "font-bold text-black flex gap-1")}
                >
                  {unavailableValue}
                  <span className="font-normal">คน</span>
                </div>
              </div>
            </div>
          </Badge>
        </div>

        {/* check-slip ticket */}
        <div className="mx-auto flex w-full lg:flex-1">
          <Badge
            variant={"outline"}
            className="p-4 flex h-auto w-full flex-col items-start justify-between gap-2 rounded-[10px] md:flex-col"
          >
            <div className="w-full flex items-center justify-between md:flex-col md:gap-2 md:items-start md:justify-center">
              <div
                className={cn(
                  styles.text,
                  "text-xl font-semibold text-black md:text-3xl lg:text-2xl",
                )}
              >
                รอตรวจสอบการชำระเงิน
                <div className="hidden md:flex text-[16px] font-normal text-muted-foreground">
                  ตรวจสลิปและอนุมัติด้วยตนเอง
                </div>
              </div>
              <Badge className="p-1 flex items-center justify-center bg-[#FFFBEB] text-[#92400E] text-[14px] rounded-[6px] [&>svg]:size-4! md:hidden">
                <Clock />
                {unavailableValue} รายการ
              </Badge>
              <div className="hidden md:flex">
                <div className="flex items-center justify-center gap-2 text-2xl font-semibold text-black">
                  <div>{unavailableValue}</div>
                  <Badge className="[&>svg]:size-6! flex items-center justify-center bg-[#FFFBEB] text-[#92400E] text-[16px] rounded-[6px]">
                    <Clock />
                    รอตรวจ
                  </Badge>
                </div>
              </div>
            </div>
            <div className={"w-full flex items-start justify-between"}>
              <div className={cn(styles.text, "md:text-lg")}>บัตรรออนุมัติ</div>
              <div
                className={cn(
                  styles.text,
                  "font-bold text-black flex gap-1 md:text-lg",
                )}
              >
                {unavailableValue}
                <span className="font-normal md:text-lg">ใบ</span>
              </div>
            </div>
            <div className={"w-full flex items-start justify-between"}>
              <div className={cn(styles.text, "md:text-lg")}>ยอดรอตรวจ</div>
              <div
                className={cn(
                  styles.text,
                  "font-bold text-black flex gap-1 md:text-lg",
                )}
              >
                {unavailableValue}
                <span className="font-normal">บาท</span>
              </div>
            </div>
            <div className={cn(styles.text, "md:text-lg")}>
              ตรวจสลิปด้วยตนเองก่อนส่ง QR ให้ผู้ซื้อ
            </div>
            <Badge className="p-3 flex items-center justify-center [&>svg]:size-4! bg-brand h-auto w-full rounded-[10px] text-[14px] lg:text-[18px] hover:bg-brand-hover hover:cursor-pointer">
              <ClipboardCheck />
              เปิดคิวตรวจสอบ
            </Badge>
          </Badge>
        </div>
      </div>

      {/* vendors */}
      <div className="mx-auto flex w-full max-w-7xl flex-col">
        <Badge
          variant={"outline"}
          className="p-4 w-full flex flex-col items-start justify-center gap-4 rounded-[10px]"
        >
          <div
            className={cn(
              styles.text,
              "text-lg text-black font-semibold md:text-xl",
            )}
          >
            ร้านค้าในงาน
          </div>
          {stores.length === 0 ? (
            <div className="w-full py-4 text-center text-muted-foreground">
              {error ? "โหลดร้านค้าไม่สำเร็จ" : "0 ร้านค้าในงานนี้"}
            </div>
          ) : (
            stores.map((store) => {
              return (
                <div
                  key={store.id}
                  className="w-full flex flex-col items-start justify-center gap-2 md:hidden"
                >
                  <div
                    className={cn(
                      styles.text,
                      "text-[14px] font-medium text-black md:text-lg",
                    )}
                  >
                    {store.name}
                  </div>
                  <div
                    className={cn(
                      styles.text,
                      "flex items-center justify-center gap-1 md:text-[14px]",
                    )}
                  >
                    {store.description ?? "ยังไม่มีรายละเอียดร้านค้า"}
                  </div>
                  <div className="w-full border-b"></div>
                </div>
              );
            })
          )}

          {/* desktop screen */}
          <div className="hidden w-full md:flex flex-col">
            <Table>
              <TableHeader className="bg-[#FAFAFA]">
                <TableRow className="text-[15px]">
                  <TableHead className="text-muted-foreground font-normal">
                    ร้านค้า
                  </TableHead>
                  <TableHead className="text-muted-foreground font-normal">
                    รายละเอียดร้านค้า
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store) => {
                  return (
                    <TableRow key={store.id}>
                      <TableCell className="text-[16px] flex items-center justify-start">
                        {store.name}
                        <Badge
                          variant={"ghost"}
                          className="h-full my-5"
                        ></Badge>
                      </TableCell>
                      <TableCell className="text-[16px]">
                        {store.description ?? "ยังไม่มีรายละเอียดร้านค้า"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="w-full border-t"></div>
            <div className="my-4 flex items-center justify-between">
              <div className="flex items-center justify-center">
                <div className="flex items-center justify-center font-semibold text-[18px] gap-2">
                  <div>รวม {stores.length} ร้าน</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile screen */}
          <div
            className={cn(
              styles.text,
              "w-full flex flex-col items-start justify-between text-lg font-semibold text-black md:hidden",
            )}
          >
            <div className="md:text-2xl md:font-semibold">
              รวม {stores.length} ร้าน
            </div>
          </div>
        </Badge>
      </div>
    </div>
  );
}
