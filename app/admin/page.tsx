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
  ArrowBigRight,
  Equal,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { EnterEventCard } from "@/components/admin/EnterEventCard";

type stats = {
  icon: LucideIcon;
  label: string;
  value: string;
  unit: string;
};

const stats: stats[] = [
  { icon: Users, label: "ลงทะเบียน", value: "1,248", unit: "คน" },
  { icon: ScanLine, label: "เช็คอิน", value: "1,248", unit: "คน" },
  { icon: Ticket, label: "ยอดบัตรที่อนุมัติแล้ว", value: "1,248", unit: "คน" },
  { icon: Coins, label: "เติม Token หน้างาน", value: "1,248", unit: "คน" },
];

type Vendor = {
  id: number;
  name: string;
  food: string;
  price: number;
  quantity: number;
  qtyUnit: string;
  incomeTk: number;
  incomeMn: number;
};

const vendors: Vendor[] = [
  {
    id: 1,
    name: "ครัวศิษย์เก่า",
    food: "ข้าวกะเพรา",
    price: 6,
    quantity: 420,
    qtyUnit: "จาน",
    incomeTk: 2520,
    incomeMn: 25200,
  },
  {
    id: 2,
    name: "กาแฟสนาม",
    food: "กาแฟเย็น",
    price: 4,
    quantity: 310,
    qtyUnit: "แก้ว",
    incomeTk: 1240,
    incomeMn: 12400,
  },
  {
    id: 3,
    name: "น้ำใจรุ่นพี่",
    food: "น้ำสมุนไพร",
    price: 2,
    quantity: 280,
    qtyUnit: "แก้ว",
    incomeTk: 560,
    incomeMn: 5600,
  },
  {
    id: 4,
    name: "ขนมบ้านเรา",
    food: "ขนมไทย",
    price: 3,
    quantity: 180,
    qtyUnit: "ชุด",
    incomeTk: 540,
    incomeMn: 5400,
  },
];

export default function AdminDashboardPage() {
  const styles = {
    text: "text-muted-foreground text-sm font-light",
  };

  const [progress, setProgress] = useState(71.3);
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:p-6 lg:scrollbar-none">
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
              684 / 960 <span className="lg:text-2xl">คน</span>
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
                className={cn(styles.text, "font-bold text-black flex gap-1 md:text-lg")}
              >
                44
                <span className="font-normal md:text-lg">ใบ</span>
              </div>
            </div>
            <div className={"w-full flex items-start justify-between"}>
              <div className={cn(styles.text, "md:text-lg")}>ยอดรอตรวจ</div>
              <div
                className={cn(styles.text, "font-bold text-black flex gap-1 md:text-lg")}
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
            ยอดขายรายร้าน
          </div>
          {vendors.map((vendor) => {
            return (
              <div
                key={vendor.name}
                className="w-full flex flex-col items-start justify-center gap-2 md:hidden"
              >
                <div
                  className={cn(
                    styles.text,
                    "text-[14px] font-medium text-black md:text-lg",
                  )}
                >
                  {vendor.name}
                </div>
                <div
                  className={cn(
                    styles.text,
                    "flex items-center justify-center gap-1 md:text-[14px]",
                  )}
                >
                  {vendor.food}
                  <div className="flex gap-1 font-semibold">
                    {vendor.incomeTk}
                    <span>Token</span>
                  </div>
                </div>

                <div
                  className={cn(
                    styles.text,
                    "w-full flex items-center justify-between text-[16px] font-semibold text-black md:text-lg",
                  )}
                >
                  <div>{vendor.incomeTk} Token</div>
                  <div>{vendor.incomeMn} Bath</div>
                </div>
                <div className="w-full border-b"></div>
              </div>
            );
          })}

          {/* desktop screen */}
          <div className="hidden w-full md:flex flex-col">
            <Table>
              <TableHeader className="bg-[#FAFAFA]">
                <TableRow className="text-[15px]">
                  <TableHead className="text-muted-foreground font-normal">
                    ร้านค้า / สินค้า
                  </TableHead>
                  <TableHead className="text-muted-foreground font-normal">
                    ราคา / หน่วย
                  </TableHead>
                  <TableHead className="text-muted-foreground font-normal">
                    จำนวนขาย
                  </TableHead>
                  <TableHead className="text-muted-foreground font-normal">
                    ยอด Token
                  </TableHead>
                  <TableHead className="text-muted-foreground font-normal">
                    เทียบเป็นบาท
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => {
                  return (
                    <TableRow key={vendor.id}>
                      <TableCell className="text-[16px]">
                        {vendor.name} / {vendor.food}
                      </TableCell>
                      <TableCell className="text-[16px]">
                        {vendor.price} Token
                      </TableCell>
                      <TableCell className="text-[16px]">
                        {vendor.quantity} {vendor.qtyUnit}
                      </TableCell>
                      <TableCell className="text-[16px]">
                        {vendor.incomeTk} Token
                      </TableCell>
                      <TableCell className="text-[16px]">
                        {vendor.incomeMn} Token
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
                  <div>รวม {vendors.length} ร้าน</div>
                  <div className="font-semibold text-[18px]">1,190 หน่วย</div>
                </div>
              </div>
              <div className="flex items-center justify-between font-semibold text-[18px] gap-2">
                <div>4,860 Token</div>
                <Equal className="text-brand" />
                <div>48,600 Bath</div>
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
            <div className="md:text-2xl md:font-semibold">รวม 4,860 Token</div>
            <div className={cn("w-full flex items-center justify-between p-2")}>
              <div className={cn(styles.text, "md:text-[16px] text-brand-ho")}>
                แปลงเป็น
              </div>
              <div className="md:text-2xl md:font-semibol text-brand">
                48,600 บาท
              </div>
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
