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
} from "lucide-react";

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

const vendors = [
  {
    name: "ครัวศิษย์เก่า",
    food: "ข้าวกะเพรา",
    token: "6",
    unit: "Token",
    incomeTk: "2,520",
    incomeMn: "25,200",
  },
  {
    name: "กาแฟสนาม",
    food: "กาแฟเย็น",
    token: "4",
    unit: "Token",
    incomeTk: "1,240",
    incomeMn: "12,400",
  },
  {
    name: "น้ำใจรุ่นพี่",
    food: "น้ำสมุนไพร",
    token: "2",
    unit: "Token",
    incomeTk: "560",
    incomeMn: "5,600",
  },
  {
    name: "ขนมบ้านเรา",
    food: "ขนมไทย",
    token: "3",
    unit: "Token",
    incomeTk: "540",
    incomeMn: "5,400",
  },
];

const styles = {
  text: "text-muted-foreground text-sm font-light",
};

export default function AdminDashboardPage() {
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
              <item.icon className="hidden md:flex" />
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

      {/* enter event */}
      <div className="mx-auto flex w-full max-w-7xl">
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
          <div className="min-w-full min-h-3 rounded-2xl bg-red-500"></div>
          <div className={"w-full flex items-start justify-between"}>
            <div className={cn(styles.text)}>เช็กอินแล้ว</div>
            <div className={cn(styles.text, "font-bold text-black")}>71.3%</div>
          </div>
          <div className={"w-full flex items-start justify-between"}>
            <div className={cn(styles.text)}>ยังไม่เช็กอิน</div>
            <div className={cn(styles.text, "font-bold text-black flex gap-1")}>
              276
              <span className="font-normal">คน</span>
            </div>
          </div>
          <div className={cn(styles.text)}>ยอดสะสม 16:00–18:42 น.</div>
        </Badge>
      </div>

      {/* ticket */}
      <div className="mx-auto flex w-full max-w-7xl">
        <Badge
          variant={"outline"}
          className="p-4 flex h-auto w-full flex-col items-start justify-between gap-2 rounded-[10px]"
        >
          <div className="w-full flex items-center justify-between">
            <div
              className={cn(
                styles.text,
                "text-xl font-semibold text-black md:text-3xl lg:text-2xl",
              )}
            >
              คิวตรวจการชำระเงิน
            </div>
            <Badge className="p-1 flex items-center justify-center bg-[#FFFBEB] text-[#92400E] text-md rounded-[6px] md:hidden">
              <Clock />
              24 รายการ
            </Badge>
          </div>
          <div className={"w-full flex items-start justify-between"}>
            <div className={cn(styles.text)}>บัตรรออนุมัติ</div>
            <div className={cn(styles.text, "font-bold text-black flex gap-1")}>
              44
              <span className="font-normal">ใบ</span>
            </div>
          </div>
          <div className={"w-full flex items-start justify-between"}>
            <div className={cn(styles.text)}>ยอดรอตรวจ</div>
            <div className={cn(styles.text, "font-bold text-black flex gap-1")}>
              38,200
              <span className="font-normal">บาท</span>
            </div>
          </div>
          <div className={cn(styles.text)}>
            ตรวจสลิปด้วยตนเองก่อนส่ง QR ให้ผู้ซื้อ
          </div>
          <Badge className="p-3 bg-brand h-auto w-full rounded-[10px] text-md font-semibold lg:text-xl hover:bg-brand-hover">
            เปิดคิวตรวจสอบ
          </Badge>
        </Badge>
      </div>

      {/* vendors */}
      <div className="mx-auto flex w-full max-w-7xl flex-col">
        <Badge
          variant={"outline"}
          className="p-4 w-full flex flex-col items-start justify-center gap-4 rounded-[10px]"
        >
          {vendors.map((vendor) => {
            return (
              <div
                key={vendor.name}
                className="w-full flex flex-col items-start justify-center gap-2"
              >
                <div className={cn(styles.text, "text-lg font-semibold")}>
                  {vendor.name}
                </div>
                <div
                  className={cn(
                    styles.text,
                    "flex items-center justify-center gap-1",
                  )}
                >
                  {vendor.food}
                  <div className="flex gap-1 font-semibold">
                    {vendor.token}
                    <span>{vendor.unit}</span>
                  </div>
                </div>

                <div
                  className={cn(
                    styles.text,
                    "w-full flex items-center justify-between text-lg font-semibold text-black",
                  )}
                >
                  <div>{vendor.incomeTk} Token</div>
                  <div>{vendor.incomeMn} Bath</div>
                </div>
                <div className="w-full border-b"></div>
              </div>
            );
          })}

          <div
            className={cn(
              styles.text,
              "w-full flex flex-col items-start justify-between text-lg font-semibold text-black",
            )}
          >
            <div>รวม 4,860 Token</div>
            <div className={cn("w-full flex items-center justify-between p-2")}>
              <div className={cn(styles.text)}>แปลงเป็น</div>
              <div>48,600 บาท</div>
            </div>
          </div>
          <Badge
            variant={"outline"}
            className="w-full rounded-[10px] p-3 text-md flex items-center justify-center"
          >
            <SquareArrowOutUpRight />
            ดูรายงานทั้งหมด
          </Badge>
        </Badge>
      </div>
    </div>
  );
}
