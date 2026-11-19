"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import type {
  AdminOrderSummary,
  EventDetail,
  Paginated,
} from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileCheck,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import OrderReviewDialog from "./OrderReviewDialog";

const filters = ["review", "all", "PENDING", "PAID", "CANCELLED"] as const;
type Filter = (typeof filters)[number];

const filterLabels: Record<Filter, string> = {
  review: "รอตรวจสลิป",
  all: "ทุกสถานะ",
  PENDING: "รอชำระ / รอตรวจ",
  PAID: "ชำระแล้ว",
  CANCELLED: "ยกเลิกแล้ว",
};

export default function PaymentsPage() {
  const { slug } = useParams<{ slug: string }>();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [filter, setFilter] = useState<Filter>("review");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<Paginated<AdminOrderSummary> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // โหลดรายการคำสั่งซื้อ
  async function loadData() {
    setLoading(true);
    setError(null);

    // 1. โหลดข้อมูลงานก่อนเพื่อเอา event id
    const eventRes = await api.events.get(slug);
    if (!eventRes.success) {
      setError(eventRes.error.message);
      setLoading(false);
      return;
    }
    setEvent(eventRes.data);

    // 2. ดึงรายการคำสั่งซื้อจาก API
    const orderRes = await api.admin.orders.list(eventRes.data.id, {
      query: query.trim() || undefined,
      page,
      status: filter === "all" || filter === "review" ? undefined : filter,
      review: filter === "review" ? "pending" : undefined,
    });

    if (orderRes.success) {
      setResult(orderRes.data);
    } else {
      setError(orderRes.error.message);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [slug, filter, page]);

  // ค้นหาเมื่อกด Enter หรือหยุดพิมพ์
  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadData();
  }

  const currentIndex =
    selectedId && result
      ? result.items.findIndex((item) => item.id === selectedId)
      : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = result
    ? currentIndex >= 0 && currentIndex < result.items.length - 1
    : false;

  function handleNavigatePrev() {
    if (result && currentIndex > 0) {
      setSelectedId(result.items[currentIndex - 1].id);
    }
  }

  function handleNavigateNext() {
    if (result && currentIndex < result.items.length - 1) {
      setSelectedId(result.items[currentIndex + 1].id);
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/admin/${slug}`}>
              {event?.title ?? slug}
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

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-2xl font-semibold tracking-tight">
            ตรวจสอบการชำระเงิน
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-10 cursor-pointer"
            onClick={loadData}
          >
            <RefreshCw className="size-4" />
            <span>รีเฟรช</span>
          </Button>
          <Button asChild variant="outline" className="min-h-10 cursor-pointer">
            <Link href={`/admin/${slug}/tickets`}>
              <ArrowLeft className="size-4" />
              <span>กลับไปหน้าบัตร</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="w-full">
        <FieldGroup className="flex flex-col sm:flex-row sm:items-end gap-3 rounded-xl border bg-card p-4 shadow-xs">
          <Field className="flex-1">
            <FieldLabel htmlFor="order-search" className="text-sm font-medium">
              ค้นหาคำสั่งซื้อ
            </FieldLabel>
            <InputGroup className="w-full h-10 flex">
              <InputGroupAddon>
                <Search className="text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                id="order-search"
                value={query}
                maxLength={100}
                placeholder="ค้นหาเลขคำสั่งซื้อ, ชื่อผู้ซื้อ หรืออีเมล..."
                className="text-sm"
                onChange={(e) => setQuery(e.target.value)}
              />
            </InputGroup>
          </Field>

          <Field className="sm:w-56">
            <FieldLabel htmlFor="order-status" className="text-sm font-medium">
              สถานะคำสั่งซื้อ
            </FieldLabel>
            <Select
              value={filter}
              onValueChange={(val) => {
                if (filters.includes(val as Filter)) {
                  setFilter(val as Filter);
                  setPage(1);
                }
              }}
            >
              <SelectTrigger id="order-status" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filters.map((f) => (
                  <SelectItem key={f} value={f}>
                    {filterLabels[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Button
            type="submit"
            variant="secondary"
            className="h-10 px-5 cursor-pointer shrink-0"
          >
            ค้นหา
          </Button>
        </FieldGroup>
      </form>

      {/* แสดงกำลังโหลดหรือเกิดข้อผิดพลาด */}
      {loading && (
        <div className="rounded-xl border bg-card p-8 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* ตารางแสดงรายการคำสั่งซื้อ */}
      {!loading && !error && result && (
        <div className="rounded-xl border bg-card p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              พบ {result.total.toLocaleString("th-TH")} คำสั่งซื้อ
              {filter === "review" && " ที่รอตรวจสลิป"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">เลขคำสั่งซื้อ</TableHead>
                  <TableHead>ผู้ซื้อ</TableHead>
                  <TableHead className="w-24 text-right">จำนวนบัตร</TableHead>
                  <TableHead className="w-32 text-right">ยอดรวม</TableHead>
                  <TableHead className="w-36">สถานะ</TableHead>
                  <TableHead className="w-28 text-center">สลิป</TableHead>
                  <TableHead className="w-28 text-right">
                    <span className="sr-only">การกระทำ</span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {result.items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground"
                    >
                      ไม่พบคำสั่งซื้อในตัวกรองนี้
                    </TableCell>
                  </TableRow>
                ) : (
                  result.items.map((order) => {
                    const isPendingSlip =
                      order.status === "PENDING" && order.hasPaymentSlip;

                    return (
                      <TableRow key={order.id} className="hover:bg-muted/30">
                        <TableCell>
                          <p className="font-semibold">{order.orderNo}</p>
                          <p className="text-xs text-muted-foreground pt-0.5">
                            {new Date(order.createdAt).toLocaleString("th-TH", {
                              timeZone: "Asia/Bangkok",
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="font-medium">{order.buyerName}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.buyerEmail}
                          </p>
                        </TableCell>

                        <TableCell className="text-right tabular-nums">
                          {order.ticketCount} ใบ
                        </TableCell>

                        <TableCell className="text-right tabular-nums font-medium">
                          ฿
                          {Number(order.total).toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>

                        <TableCell>
                          {order.status === "PAID" && (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-300 gap-1 font-normal"
                            >
                              <CheckCircle2 className="size-3.5" />
                              ชำระแล้ว
                            </Badge>
                          )}
                          {order.status === "PENDING" && (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-300 gap-1 font-normal"
                            >
                              <Clock className="size-3.5" />
                              {order.hasPaymentSlip
                                ? "รอตรวจสลิป"
                                : "รอชำระเงิน"}
                            </Badge>
                          )}
                          {order.status === "CANCELLED" && (
                            <Badge
                              variant="outline"
                              className="bg-red-50 text-red-700 border-red-300 gap-1 font-normal"
                            >
                              <XCircle className="size-3.5" />
                              ยกเลิกแล้ว
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          {order.hasPaymentSlip ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                              <FileCheck className="size-4" />
                              มีสลิป
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant={isPendingSlip ? "brand" : "outline"}
                            size="sm"
                            className="min-h-8 cursor-pointer"
                            onClick={() => setSelectedId(order.id)}
                          >
                            {isPendingSlip ? "ตรวจสลิป" : "ดูคำสั่งซื้อ"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {result.total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
              <span className="text-sm text-muted-foreground tabular-nums">
                หน้า {page} จาก{" "}
                {Math.max(1, Math.ceil(result.total / result.pageSize))}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="cursor-pointer"
                >
                  ก่อนหน้า
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page * result.pageSize >= result.total}
                  onClick={() => setPage(page + 1)}
                  className="cursor-pointer"
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialog ตรวจสอบและจัดการคำสั่งซื้อ */}
      {event && (
        <OrderReviewDialog
          eventId={event.id}
          orderId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={() => {
            loadData();
          }}
          onNavigatePrev={handleNavigatePrev}
          onNavigateNext={handleNavigateNext}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      )}
    </div>
  );
}
