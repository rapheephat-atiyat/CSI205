"use client";
import { cn } from "cn";

// ui
import { Badge } from "@/components/ui/badge";
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
import { Download, Equal } from "lucide-react";

// data
import { vendors } from "@/app/admin/page";
type ReportItem = {
  id: string;
  title: string;
  description: string;
  total: number;
  unit: string;
};

export const reports: ReportItem[] = [
  {
    id: "report-attendees",
    title: "รายชื่อผู้เข้าร่วม",
    description: "ชื่อ • อีเมล • ปีเข้าศึกษา พ.ศ. • เช็กอิน",
    total: 1248,
    unit: "คน",
  },
  {
    id: "report-shirt-orders",
    title: "คำสั่งซื้อเสื้อพร้อมที่อยู่",
    description: "ขนาด • จำนวน • ผู้รับ • โทรศัพท์ • ที่อยู่จัดส่ง",
    total: 192,
    unit: "รายการ",
  },
  {
    id: "report-vendors",
    title: "รายงานร้านค้า",
    description: "สินค้าเดียว • จำนวน • Token • บาท • อัตรา",
    total: 4,
    unit: "ร้าน",
  },
  {
    id: "report-token-topups",
    title: "รายการเติม Token",
    description: "ผู้เติม • บาทรับจริง • Token • สลิป • ผู้ดูแล",
    total: 138,
    unit: "รายการ",
  },
];

export default function Page() {
  return (
    <div className="p-4 w-full flex mx-auto flex-col items-start justify-center">
      <div className="w-full flex items-center justify-start">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">ภาพรวมงาน</BreadcrumbLink>
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
        {/* export data */}
        <Badge
          variant={"outline"}
          className="p-4 flex flex-col items-start justify-center w-full h-auto rounded-[10px] gap-1.5"
        >
          {/* หัวเรื่อง */}
          <div className="flex flex-col items-start justify-center">
            <div className="text-[16px] font-semibold text-black">
              ชุดข้อมูลพร้อมส่งออก
            </div>
          </div>

          {/* data */}
          {/* mobile */}
          <div className="w-full flex flex-col gap-2 md:hidden">
            {reports.map((report) => {
              return (
                <Badge
                  key={report.id}
                  variant={"outline"}
                  className="p-4 w-full flex flex-col items-start justify-center rounded-[10px] gap-2"
                >
                  <div className="text-[15px]">{report.title}</div>
                  <div className="w-full flex items-center justify-between">
                    <div className="text-muted-foreground">จำนวน</div>
                    <div className="font-semibold">
                      {report.total} {report.unit}
                    </div>
                  </div>
                  <div className="w-full flex items-center justify-around gap-3">
                    <Badge
                      variant={"outline"}
                      className="p-2 w-full flex-1 items-center justify-center text-sm! rounded-[10px] [&>svg]:size-4! gap-1"
                    >
                      <Download />
                      CSV
                    </Badge>
                    <Badge
                      variant={"outline"}
                      className="p-2 w-full flex-1 items-center justify-center text-sm! rounded-[10px] [&>svg]:size-4! gap-1"
                    >
                      <Download />
                      XLSX
                    </Badge>
                  </div>
                </Badge>
              );
            })}
          </div>

          {/* desktop */}
          <div className="hidden w-full items-center justify-around gap-3 md:flex">
            <div className="w-full flex items-start justify-center gap-3">
              {/* box 1 */}
              <Badge
                variant={"outline"}
                className="p-4 w-full h-full flex-1 flex flex-col gap-2 rounded-[10px]"
              >
                <div className="flex flex-col items-start justify-center gap-0.5">
                  <div className="text-lg font-semibold">
                    ยอดเงินรับที่ยืนยันแล้ว
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    บัตร, เสื้อ และการเติม Token
                  </div>
                </div>
                <div className="flex flex-col items-start justify-center gap-1">
                  <div className="w-full flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      บัตรอนุมัติ 960 ใบ
                    </div>
                    <div className="text-sm ">660,000 บาท</div>
                  </div>
                  <div className="w-full flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      เสื้ออนุมัติ 262 ตัว
                    </div>
                    <div className="text-sm ">78,600 บาท</div>
                  </div>
                  <div className="w-full flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      เติม Token 138 รายการ
                    </div>
                    <div className="text-sm ">34,500 บาท</div>
                  </div>
                </div>
                <div className="w-full border"></div>
                <div className="w-full flex items-center justify-between">
                  <div className="text-sm ">เติม Token 138 รายการ</div>
                  <div className="text-sm ">34,500 บาท</div>
                </div>
              </Badge>
              {/* box 2 */}
              <Badge
                variant={"outline"}
                className="p-4 w-full h-full flex-1 flex flex-col gap-2 rounded-[10px]"
              >
                <div className="flex flex-col items-start justify-center gap-0.5">
                  <div className="text-lg font-semibold">ยอด Token ร้านค้า</div>
                  <div className="text-sm font-medium text-muted-foreground">
                    ไม่บวกซ้ำเป็นเงินรับใหม่
                  </div>
                </div>
                <div className="flex flex-col items-start justify-center gap-1">
                  <div className="w-full flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Token รวมจากบัตร + เติม
                    </div>
                    <div className="text-sm ">27,450 Token</div>
                  </div>
                  <div className="w-full flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      ใช้ซื้อสินค้าแล้ว
                    </div>
                    <div className="text-sm ">4,860 Token</div>
                  </div>
                  <div className="w-full flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Token คงเหลือรวม
                    </div>
                    <div className="text-sm ">22,590 Token</div>
                  </div>
                </div>
                <div className="w-full border"></div>
                <div className="w-full flex items-center justify-between">
                  <div className="text-sm ">ยอดร้านค้าเทียบบาท</div>
                  <div className="text-sm ">48,600 บาท</div>
                </div>
              </Badge>
            </div>
          </div>
          <Badge
            variant={"outline"}
            className="hidden p-4 w-full h-full flex-1 flex-col gap-2 rounded-[10px] md:flex"
          >
            <div className="w-full flex flex-col items-start justify-center">
              <div className="text-lg font-semibold">รายงานยอดขายรายร้าน</div>
              <div className="text-[14px] font-medium text-muted-foreground">
                ยอดเทียบบาท = ยอด Token × 10 บาท / Token
              </div>
            </div>
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
                        <TableCell className="text-[16px] flex items-center justify-start">
                          {vendor.name} / {vendor.food}
                          <Badge
                            variant={"ghost"}
                            className="h-full my-5"
                          ></Badge>
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
          </Badge>

          {/* export */}
          <Badge
            variant={"outline"}
            className="hidden p-4 w-full h-full flex-1 flex-col gap-2 rounded-[10px] md:flex"
          >
            <Table>
              <TableCaption>
                สามารถเลือกได้ว่าจะส่งออกข้อมูลรูปแบบ CSV / XLSX
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ชุดรายงาน</TableHead>
                  <TableHead>ข้อมูลสำคัญในไฟล์</TableHead>
                  <TableHead>จำนวน</TableHead>
                  <TableHead className="text-center">
                    รูปแบบ / ดาวน์โหลด
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => {
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-[16px] font-medium">
                        {r.title}
                      </TableCell>
                      <TableCell className="text-[14px] font-medium text-muted-foreground">
                        {r.description}
                      </TableCell>
                      <TableCell className="text-right">{r.total}</TableCell>
                      <TableCell>
                        <div className="w-full flex items-center justify-center gap-3">
                          <Badge
                            variant={"outline"}
                            className="p-2 w-full flex-1 items-center justify-center text-sm! rounded-[10px] [&>svg]:size-4! gap-1 hover:bg-brand-hover hover:text-on-brand hover:cursor-pointer"
                          >
                            <Download />
                            CSV
                          </Badge>
                          <Badge
                            variant={"outline"}
                            className="p-2 w-full flex-1 items-center justify-center text-sm! rounded-[10px] [&>svg]:size-4! gap-1 hover:bg-brand-hover hover:text-on-brand hover:cursor-pointer"
                          >
                            <Download />
                            XLSX
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Badge>
        </Badge>
      </div>
    </div>
  );
}
