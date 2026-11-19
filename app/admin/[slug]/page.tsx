"use client";

import { useEffect, useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { EnterEventCard } from "@/components/admin/EnterEventCard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { EventDetail, OverviewReport } from "@/lib/api-types";
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

  // overview report
  const [report, setReport] = useState<OverviewReport | null>(null);
  useEffect(() => {
    async function loadReport() {
      const res = await api.admin.reports.overview();
      if (res.success) setReport(res.data);
      else setError(res.error.message);
    }
    loadReport();
  }, [slug]);
  const styles = {
    text: "text-muted-foreground text-sm font-light",
  };

  // effect to load event details
  useEffect(() => {
    async function load() {
      const res = await api.events.get(`${slug}`);
      if (res.success) {
        setEvent(res.data);
        setStores(res.data.stores);
      } else {
        setError(res.error.message);
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  const progress = report
    ? (report.totalCheckedIn / report.totalTicketsSold) * 100
    : 0;

  const stats: Stat[] = [
    {
      icon: Users,
      label: "จำนวนบัตรที่ถูกจอง",
      value: (report?.totalTicketsSold ?? 0).toLocaleString(),
      unit: "ใบ",
    },
    {
      icon: ScanLine,
      label: "จำนวนเช็กอิน",
      value: (report?.totalCheckedIn ?? 0).toLocaleString(),
      unit: "คน",
    },
    {
      icon: Ticket,
      label: "ยอดออเดอร์ที่ชำระแล้ว",
      value: (report?.totalTicketRevenue ?? 0).toLocaleString(),
      unit: "ออเดอร์",
    },
    {
      icon: Coins,
      label: "ยอดร้านค้า",
      value: (report?.totalStoreVolume ?? 0).toLocaleString(),
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
          <span>คืนสู่เหย้า 2569</span>
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
              {report?.totalCheckedIn.toLocaleString() ?? 0} /
              {report?.totalTicketsSold.toLocaleString() ?? 0}
              <span className="lg:text-2xl">คน</span>
            </div>
            {/* Progress bar */}
            <div className="w-full">
              <Progress
                value={progress}
                className={`w-full h-1.5 ${progress === 0 ? "bg-muted-foreground/40" : "bg-muted-foreground/30"}`}
              />
            </div>
            <div className="hidden w-full flex-col gap-4 md:flex">
              {/* EnterEventCard components */}
              <div className="w-full flex. items-center justify-center mx-auto">
                <EnterEventCard />
              </div>
              <div className="w-full flex items-start justify-between">
                <div className="text-lg text-muted-foreground font-semibold">
                  ยังไม่เช็กอิน
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="text-lg font-semibold">276 คน</div>
                  <div className="text-lg font-semibold">27.8%</div>
                </div>
              </div>
            </div>
            {/* Mobile */}
            <div className="w-full flex flex-col items-start justify-center gap-2 md:hidden">
              <div className={"w-full flex items-start justify-between"}>
                <div className={cn(styles.text)}>เช็กอินแล้ว</div>
                <div className={cn(styles.text, "font-bold text-black")}>
                  71.3%
                </div>
              </div>
              <div className={"w-full flex items-start justify-between"}>
                <div className={cn(styles.text)}>ยังไม่เช็กอิน</div>
                <div
                  className={cn(styles.text, "font-bold text-black flex gap-1")}
                >
                  276
                  <span className="font-normal">คน</span>
                </div>
              </div>
              <div className={cn(styles.text)}>ยอดสะสม 16:00–18:42 น.</div>
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
                24 รายการ
              </Badge>
              <div className="hidden md:flex">
                <div className="flex items-center justify-center gap-2 text-2xl font-semibold text-black">
                  <div>24</div>
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
                44
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
                38,200
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
              ยังไม่มีร้านค้าในงานนี้
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
          <Badge
            variant={"outline"}
            className="w-full flex items-center justify-center [&>svg]:size-4! rounded-[10px] p-3 text-[14px] md:text-[18px] gap-2 outline outline-brand hover:cursor-pointer hover:bg-brand-hover hover:text-on-brand"
          >
            <SquareArrowOutUpRight />
            ดูรายงานทั้งหมด
          </Badge>
        </Badge>
      </div>
    </div>
  );
}
