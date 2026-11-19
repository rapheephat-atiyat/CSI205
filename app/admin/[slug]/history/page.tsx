"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SearchIcon } from "lucide-react";

// UI
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";

import { WalletHistoryItem } from "@/lib/api-types";
import { api } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

// แปลง type เป็นภาษาไทย
const typeLabel: Record<string, string> = {
  TOPUP: "เติมเงิน",
  PURCHASE: "ซื้อสินค้า",
  REFUND: "คืนเงิน",
};

const statusLabel: Record<string, string> = {
  COMPLETED: "สำเร็จ",
  PENDING: "รอดำเนินการ",
  REJECTED: "ถูกปฏิเสธ",
};

const statusColor: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default function Page() {
  const params = useParams();
  const slug = params.slug as string;

  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState<WalletHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLog() {
      try {
        setLoading(true);
        const res = await api.admin.reports.auditLog();
        if (res.success) {
          setLogs(res.data);
        } else {
          setError(res.error.message);
        }
      } catch (err) {
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    }

    fetchLog();
  }, []);

  // Filter
  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    return (
      log.note?.toLowerCase().startsWith(q.trim()) ||
      log.type.toLowerCase().startsWith(q.trim()) ||
      log.ref?.toLowerCase().startsWith(q.trim()) ||
      typeLabel[log.type]?.startsWith(search)
    );
  });

  // จัดรูปแบบวันที่
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // จัดรูปแบบเงิน
  const formatMoney = (value: string) => {
    return Number(value).toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

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

          {/* การ์ด 1 ใบ */}
          <div className="w-full flex flex-col items-center justify-center gap-4">
            <Skeleton className="h-140 w-full rounded-[10px] bg-on-brand" />
          </div>
        </div>
      </div>
    );

  return (
    <div className="p-4 w-full flex mx-auto flex-col items-start justify-center">
      {/* Breadcrumbs */}
      <div className="w-full flex items-center justify-start">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/admin/${slug}`}>ภาพรวมงาน</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>ประวัติ Wallet</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="p-4 mx-auto w-full max-w-7xl flex flex-col items-start justify-center gap-4">
        {/* หัวเรื่อง */}
        <div className="flex flex-col items-start justify-center">
          <div className="text-[24px] font-semibold text-black">
            ประวัติ Wallet
          </div>
          <div className="text-[14px] font-medium text-muted-foreground">
            รายการเติมเงิน / ซื้อสินค้า ทั้งหมด
          </div>
        </div>

        {/* Container */}
        <Badge
          variant="outline"
          className="p-4 flex flex-col items-start justify-center w-full h-auto rounded-[10px] gap-1.5"
        >
          {/* Search */}
          <div className="flex w-full flex-col items-start justify-center gap-1">
            <FieldGroup className="flex lg:flex-row w-full">
              <Field className="lg:flex-2 w-full">
                <FieldLabel
                  htmlFor="search-wallet-history"
                  className="text-sm text-muted-foreground"
                >
                  ค้นหา
                </FieldLabel>
                <InputGroup className="w-full h-auto flex p-2">
                  <InputGroupInput
                    placeholder="ค้นหาหมายเหตุ, ประเภท, เลขที่อ้างอิง..."
                    className="text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <InputGroupAddon>
                    <SearchIcon className="text-muted-foreground" />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            </FieldGroup>
          </div>

          {/* Content */}
          <Badge
            variant="outline"
            className="p-4 flex flex-col items-start justify-center w-full h-auto rounded-[10px] gap-1.5 mt-2"
          >
            {loading ? (
              <div className="w-full flex justify-center py-12">
                <Spinner className="size-8 text-brand" />
              </div>
            ) : error ? (
              <div className="w-full text-center py-8 text-red-600">
                {error}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="w-full text-center py-8 text-muted-foreground">
                ไม่พบรายการ
              </div>
            ) : (
              <>
                {/* ===== Mobile View ===== */}
                <div className="flex w-full flex-col gap-3 md:hidden">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-col gap-2 p-4 rounded-lg border bg-white"
                    >
                      <div className="flex justify-between items-start">
                        <div className="text-xs text-muted-foreground">
                          {formatDate(log.createdAt)}
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${statusColor[log.status]}`}
                        >
                          {statusLabel[log.status] || log.status}
                        </span>
                      </div>

                      <div className="font-semibold text-base">
                        {typeLabel[log.type] || log.type}
                      </div>

                      <div className="text-sm">
                        <span className="text-muted-foreground">จำนวน: </span>
                        <span className="font-medium">
                          {formatMoney(log.amount)} บาท
                        </span>
                      </div>

                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          ก่อน → หลัง:{" "}
                        </span>
                        <span className="font-medium">
                          {formatMoney(log.before)} → {formatMoney(log.after)}
                        </span>
                      </div>

                      {log.note && (
                        <div className="text-sm text-muted-foreground">
                          {log.note}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground mt-1">
                        Ref: {log.ref}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ===== Desktop View ===== */}
                <div className="hidden w-full max-h-[600px] overflow-y-auto md:block">
                  <Table>
                    <TableHeader className="bg-[#FAFAFA]">
                      <TableRow className="text-[15px]">
                        <TableHead className="text-muted-foreground font-normal w-[180px]">
                          วันเวลา
                        </TableHead>
                        <TableHead className="text-muted-foreground font-normal w-[100px]">
                          ประเภท
                        </TableHead>
                        <TableHead className="text-muted-foreground font-normal w-[120px]">
                          สถานะ
                        </TableHead>
                        <TableHead className="text-muted-foreground font-normal text-right w-[130px]">
                          จำนวนเงิน
                        </TableHead>
                        <TableHead className="text-muted-foreground font-normal w-auto">
                          ก่อน → หลัง
                        </TableHead>
                        <TableHead className="text-muted-foreground font-normal w-[330px]">
                          หมายเหตุ
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id} className="text-sm">
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </TableCell>

                          <TableCell className="font-medium">
                            {typeLabel[log.type] || log.type}
                          </TableCell>

                          <TableCell>
                            <Badge
                              className={`p-2 text-xs px-2 py-0.5 rounded-full ${statusColor[log.status]}`}
                            >
                              {statusLabel[log.status] || log.status}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right font-medium">
                            {formatMoney(log.amount)}
                          </TableCell>

                          <TableCell className="text-xs">
                            {formatMoney(log.before)} → {formatMoney(log.after)}
                          </TableCell>

                          <TableCell className="max-w-[280px]">
                            <div className="truncate">{log.note || "-"}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {log.ref}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </Badge>
        </Badge>
      </div>
    </div>
  );
}
