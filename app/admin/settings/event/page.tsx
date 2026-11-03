"use client";

// import ui
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Pencil, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

// head
type HeadEv = {
  caption: string;
  name: string;
  date: string;
  place: string;
};
const headEv: HeadEv = {
  caption: "รายการงานทั้งหมด",
  name: "ชื่องาน",
  date: "วันเวลา",
  place: "สถานที่",
};

// data
const invoices = [
  {
    invoice: "INV001",
    paymentStatus: "paid" as const,
    totalAmount: "$250.00",
    paymentMethod: "creditCard" as const,
  },
  {
    invoice: "INV002",
    paymentStatus: "pending" as const,
    totalAmount: "$150.00",
    paymentMethod: "paypal" as const,
  },
  {
    invoice: "INV003",
    paymentStatus: "unpaid" as const,
    totalAmount: "$350.00",
    paymentMethod: "bankTransfer" as const,
  },
  {
    invoice: "INV004",
    paymentStatus: "paid" as const,
    totalAmount: "$450.00",
    paymentMethod: "creditCard" as const,
  },
  {
    invoice: "INV005",
    paymentStatus: "paid" as const,
    totalAmount: "$550.00",
    paymentMethod: "paypal" as const,
  },
  {
    invoice: "INV006",
    paymentStatus: "pending" as const,
    totalAmount: "$200.00",
    paymentMethod: "bankTransfer" as const,
  },
  {
    invoice: "INV007",
    paymentStatus: "unpaid" as const,
    totalAmount: "$300.00",
    paymentMethod: "creditCard" as const,
  },
];

export default function Page() {
  return (
    <div className="p-4 mx-auto w-full flex flex-col items-center justify-start">
      {/* Breadcrumbs */}
      <div className="w-full flex items-center justify-start">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">ภาพรวมงาน</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>จัดการงงาน</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* container */}
      <div className="p-4 mx-auto w-full max-w-7xl flex flex-col items-start justify-center gap-4">
        {/* หัวเรื่อง */}
        <div className="flex flex-col items-start justify-center">
          <div className="text-[24px] font-semibold text-black">จัดการงาน</div>
          <div className="text-[14px] font-medium text-muted-foreground">
            ดูรายละเอียดและแก้ไข
          </div>
        </div>

        {/* search event */}
        <div className="w-full flex flex-col">
          <Badge
            variant={"outline"}
            className="p-4 flex flex-col items-start justify-center w-full h-auto rounded-[10px] gap-3.5"
          >
            <div className="w-full flex items-center justify-between">
              <div className="text-[24px] font-semibold text-black">
                ค้นหางาน
              </div>
              <Badge
                asChild
                className="p-3 bg-brand text-on-brand  text-sm flex items-center justify-center rounded-[10px] hover:cursor-pointer hover:bg-brand-hover [&>svg]:size-4!"
              >
                <Link href={"/admin/settings/event/create"}>
                  <Plus />
                  เพิ่มงาน
                </Link>
              </Badge>
            </div>
            <div className="w-full">
              <div className="w-full">
                <Field>
                  <FieldLabel htmlFor="input-button-group">ชื่องาน</FieldLabel>
                  <ButtonGroup className="flex flex-row items-start justify-center">
                    <Input
                      id="input-event-name"
                      placeholder="ค้นหาชื่องาน"
                      className="p-5 rounded-[10px]"
                    />
                  </ButtonGroup>
                </Field>
              </div>
            </div>
          </Badge>
        </div>

        {/* all events */}
        <div className="w-full flex flex-col">
          {/* หัวเรื่อง */}
          <div className="flex flex-col items-start justify-center">
            <div className="text-[18px] font-semibold text-black">
              รายการงาน
            </div>
          </div>
          <div className="w-full mt-4">
            <Table>
              <TableCaption>{headEv.caption}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-50 text-[14px] text-muted-foreground font-normal">
                    {headEv.name}
                  </TableHead>
                  <TableHead className="text-[14px] text-muted-foreground font-normal">
                    {headEv.date}
                  </TableHead>
                  <TableHead className="text-[14px] text-muted-foreground font-normal">
                    {headEv.place}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="w-full">
                {invoices.map((invoice) => (
                  <TableRow key={invoice.invoice}>
                    <TableCell className="w-auto! text-[16px] overflow-hidden">
                      {invoice.invoice}asd
                    </TableCell>
                    <TableCell className="w-auto text-[16px]">
                      {invoice.paymentMethod}
                    </TableCell>
                    <TableCell className="w-auto text-[16px]">
                      {invoice.paymentStatus}
                    </TableCell>
                    <TableCell className="w-30 text-right ">
                      <Badge
                        asChild
                        variant={"outline"}
                        className="p-3 mt-1 text-sm flex gap-1.5 items-center justify-center rounded-[10px] hover:cursor-pointer hover:bg-brand-hover [&>svg]:size-4!"
                      >
                        <Link href={`/admin/settings/event/detail`}>
                          <Pencil />
                          แก้ไขงาน
                        </Link>
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
