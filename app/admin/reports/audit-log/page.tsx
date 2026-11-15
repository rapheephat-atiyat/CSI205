"use client";

import { useEffect, useState } from "react";

// import icons
import { SearchIcon } from "lucide-react";

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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// data
type AuditLog = {
  id: string;
  timestamp: string;
  action: string;
  actor: {
    name: string;
    role: string;
  };
  relatedItem: {
    label: string;
    value: string;
  };
  changes: {
    statusChange?: {
      from: string;
      to: string;
    };
    description?: string;
    roleChange?: {
      from: string;
      to: string;
    };
    note?: string;
  };
  targetUrl?: string;
};
const auditLog: AuditLog[] = [
  {
    id: "log-001",
    timestamp: "28 พ.ย. 69 · 18:35:40",
    action: "อนุมัติชำระเงิน",
    actor: {
      name: "ธนกร รัตนชัย",
      role: "Super admin",
    },
    relatedItem: {
      label: "รายการที่เกี่ยวข้อง",
      value: "RE2569-1047",
    },
    changes: {
      statusChange: {
        from: "รอตรวจ",
        to: "อนุมัติแล้ว",
      },
      description: "ยอดรับ 1,000 บาท",
    },
    targetUrl: "/admin/payments/RE2569-1047",
  },
  {
    id: "log-002",
    timestamp: "28 พ.ย. 69 · 18:22:10",
    action: "แก้สิทธิ์ผู้ดูแล",
    actor: {
      name: "พิมพ์ชนก ศรีสุข",
      role: "Super admin",
    },
    relatedItem: {
      label: "รายการที่เกี่ยวข้อง",
      value: "มาลี สุขใจ",
    },
    changes: {
      roleChange: {
        from: "Vendor admin",
        to: "คงเดิม",
      },
      note: "ผูกร้านครัวศิษย์เก่า",
    },
    targetUrl: "/admin/users/malee",
  },
  {
    id: "log-003",
    timestamp: "27 พ.ย. 69 · 14:10:05",
    action: "อัปเดตข้อมูลร้านค้า",
    actor: {
      name: "สมชาย ใจดี",
      role: "Admin",
    },
    relatedItem: {
      label: "รายการที่เกี่ยวข้อง",
      value: "ร้านอาหารอร่อยเหาะ",
    },
    changes: {
      description: "เปลี่ยนเบอร์โทรศัพท์ติดต่อ",
    },
    targetUrl: "/admin/vendors/v-003",
  },
];

export default function Page() {
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    console.log(search);
  }, [search]);

  return (
    <>
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
                <BreadcrumbPage>ประวัติการแก้ไข</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="p-4 mx-auto w-full max-w-7xl flex flex-col items-start justify-center gap-4">
          {/* หัวเรื่อง */}
          <div className="flex flex-col items-start justify-center">
            <div className="text-[24px] font-semibold text-black">
              ประวัติการแก้ไข
            </div>
            <div className="text-[14px] font-medium text-muted-foreground">
              ตรวจสอบว่าใคร เปลี่ยนอะไร และเมื่อใด
            </div>
          </div>

          {/*container*/}
          <Badge
            variant={"outline"}
            className="p-4 flex flex-col items-start justify-center w-full h-auto rounded-[10px] gap-1.5"
          >
            {/* search box */}
            <div className="flex w-full flex-col items-start justify-center">
              <div className="flex w-full flex-col items-start justify-center gap-1">
                <FieldGroup className="flex lg:flex-row">
                  <Field className="lg:flex-2">
                    <FieldLabel
                      htmlFor="search-audit-log"
                      className="text-sm text-muted-foreground"
                    >
                      ค้นหา
                    </FieldLabel>
                    <InputGroup className="w-full h-auto flex p-2">
                      <InputGroupInput
                        placeholder="ค้นชื่อผู้แก้ไข"
                        className="text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      <InputGroupAddon>
                        <SearchIcon className="text-muted-foreground" />
                      </InputGroupAddon>
                      <InputGroupAddon
                        align="inline-end"
                        className="hidden lg:flex"
                      ></InputGroupAddon>
                    </InputGroup>
                  </Field>
                </FieldGroup>
              </div>
            </div>

            {/*show audit log*/}
            <Badge
              variant={"outline"}
              className="p-4 flex flex-col items-start justify-center w-full h-auto rounded-[10px] gap-1.5"
            >
              {/* mobile */}
              <div className="flex w-full flex-col items-start justify-center gap-1 md:hidden">
                {auditLog
                  .filter((log) => {
                    return (
                      log.actor.name.startsWith(search) ||
                      log.relatedItem.value.startsWith(search)
                    );
                  })
                  .map((log) => {
                    return (
                      <div
                        key={log.id}
                        className="flex w-full flex-col items-start justify-center gap-1 p-4 rounded-lg"
                      >
                        <div className="text-xs text-muted-foreground">
                          {log.timestamp}
                        </div>
                        <div className="text-base font-semibold">
                          {log.action}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {log.actor.name} / {log.actor.role}
                        </div>
                        <div className="w-full flex items-center justify-between text-sm py-1">
                          <span>{log.relatedItem.label}</span>
                          <span className="font-medium">
                            {log.relatedItem.value}
                          </span>
                        </div>

                        {/* ส่วน Before -> After และรายละเอียดการเปลี่ยนแปลง */}
                        <Badge
                          variant={"outline"}
                          className="p-3 w-full rounded-[8px] flex flex-col items-start gap-1 bg-muted/30"
                        >
                          <div className="text-xs text-muted-foreground">
                            ก่อน → หลัง
                          </div>

                          {/* กรณีมีการเปลี่ยนสถานะ */}
                          {log.changes.statusChange && (
                            <div className="text-sm font-medium">
                              {log.changes.statusChange.from} →{" "}
                              {log.changes.statusChange.to}
                            </div>
                          )}

                          {/* กรณีมีการเปลี่ยนสิทธิ์ */}
                          {log.changes.roleChange && (
                            <div className="text-sm font-medium">
                              {log.changes.roleChange.from} →{" "}
                              {log.changes.roleChange.to}
                            </div>
                          )}

                          {/* กรณีมีข้อความอธิบายเพิ่มเติม หรือ Note */}
                          {log.changes.description && (
                            <div className="text-sm">
                              {log.changes.description}
                            </div>
                          )}
                          {log.changes.note && (
                            <div className="text-sm">{log.changes.note}</div>
                          )}
                        </Badge>
                        <div className="mt-4 w-full border border-muted-foreground/70"></div>
                      </div>
                    );
                  })}
              </div>
              {/* desktop */}
              <div className="hidden w-full flex-col items-start justify-center gap-1 md:flex">
                <Table>
                  <TableHeader className="bg-[#FAFAFA]">
                    <TableRow className="text-[15px]">
                      <TableHead className="text-muted-foreground font-normal">
                        วันเวลา
                      </TableHead>
                      <TableHead className="text-muted-foreground font-normal">
                        ผู้กระทำ / บทบาท
                      </TableHead>
                      <TableHead className="text-muted-foreground font-normal">
                        การกระทำ
                      </TableHead>
                      <TableHead className="text-muted-foreground font-normal">
                        รายการที่เกี่ยวข้อง
                      </TableHead>
                      <TableHead className="text-muted-foreground font-normal">
                        ก่อน → หลัง
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {auditLog
                      .filter((log) => {
                        return (
                          log.actor.name.startsWith(search) ||
                          log.relatedItem.value.startsWith(search)
                        );
                      })
                      .map((log) => (
                        <TableRow key={log.id} className="text-sm">
                          {/* วันเวลา */}
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {log.timestamp}
                          </TableCell>

                          {/* ผู้กระทำ / บทบาท */}
                          <TableCell>
                            <div className="font-medium text-foreground">
                              {log.actor.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {log.actor.role}
                            </div>
                          </TableCell>

                          {/* การกระทำ */}
                          <TableCell className="font-medium text-foreground">
                            {log.action}
                          </TableCell>

                          {/* รายการที่เกี่ยวข้อง */}
                          <TableCell>
                            <div className="text-xs text-muted-foreground">
                              {log.relatedItem.label}
                            </div>
                            <div className="font-medium">
                              {log.relatedItem.value}
                            </div>
                          </TableCell>

                          {/* ก่อน → หลัง */}
                          <TableCell>
                            <div className="flex flex-col gap-0.5 text-xs">
                              {log.changes.statusChange && (
                                <span className="font-medium">
                                  {log.changes.statusChange.from} →{" "}
                                  {log.changes.statusChange.to}
                                </span>
                              )}
                              {log.changes.roleChange && (
                                <span className="font-medium">
                                  {log.changes.roleChange.from} →{" "}
                                  {log.changes.roleChange.to}
                                </span>
                              )}
                              {log.changes.description && (
                                <span className="text-muted-foreground">
                                  {log.changes.description}
                                </span>
                              )}
                              {log.changes.note && (
                                <span className="text-muted-foreground">
                                  {log.changes.note}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </Badge>
          </Badge>
        </div>
      </div>
    </>
  );
}
