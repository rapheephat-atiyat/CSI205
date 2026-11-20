"use client";

import { useEffect, useState } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useVendorStore } from "@/components/vendor/vendor-store-context";
import { api } from "@/lib/api-client";
import type { StoreSalesSummary } from "@/lib/api-types";
import Image from "next/image";
import { Coffee, Coins, Receipt } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

const chartConfig = {
  sales: {
    label: "ยอดขาย (Token)",
    color: "#f8cdd2",
  },
} satisfies ChartConfig;

const HIGHLIGHT = "#e0313f";
const LIGHT = "#f8cdd2";
const formatToken = (value: number) =>
  value.toLocaleString("th-TH", { maximumFractionDigits: 2 });
const transactionTimeFormat = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Bangkok",
});

export function VendorDashboardClient() {
  const { selectedStore } = useVendorStore();
  const [salesState, setSalesState] = useState<{
    storeId: string;
    response: Awaited<ReturnType<typeof api.store.sales>>;
  } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const storeId = selectedStore?.id;

  useEffect(() => {
    if (!storeId) return;
    let active = true;

    void api.store.sales(storeId)
      .then((response) => {
        if (active) setSalesState({ storeId, response });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setSalesState({
          storeId,
          response: {
            success: false,
            error: {
              code: "NETWORK_ERROR",
              message: error instanceof Error ? error.message : "โหลดข้อมูลยอดขายไม่สำเร็จ",
            },
          },
        });
      });

    return () => {
      active = false;
    };
  }, [storeId, reloadKey]);

  const salesResponse =
    salesState && storeId && salesState.storeId === storeId ? salesState.response : null;
  const salesLoading = salesResponse === null;
  const salesError =
    salesResponse && !salesResponse.success ? salesResponse.error.message : null;
  const salesSummary: StoreSalesSummary | null =
    salesResponse?.success ? salesResponse.data : null;
  const chartData = salesSummary?.dailySales ?? [];
  const lastIndex = chartData.length - 1;

  const storeName = selectedStore?.name ?? "ร้านค้า";
  const storeCode = selectedStore?.code;

  return (
    <div className="w-full flex flex-col gap-10 pb-8">
      {/* ส่วนหัว */}
      <div className="flex items-center justify-between p-4">
        <div className="text-4xl font-bold">
          Vendor Dashboard
          <div className="text-sm text-gray-500">
            ภาพรวมยอดขายของ {storeName}{storeCode ? ` · ร้านค้า ${storeCode}` : ""}
          </div>
        </div>
      </div>

      {salesError && (
        <div
          role="alert"
          className="mx-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <span>โหลดข้อมูลยอดขายไม่สำเร็จ: {salesError}</span>
          <button
            type="button"
            className="rounded-md border border-current px-3 py-1 font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            ลองอีกครั้ง
          </button>
        </div>
      )}

      {/* การ์ดสรุป 2 ใบ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 px-4 md:px-10">
        <div className="border border-black/10 rounded-xl relative p-6 flex flex-col gap-5">
          <h6>ยอดขายวันนี้</h6>
          <div className="text-5xl text-brand font-bold">
            {salesLoading ? "กำลังโหลด..." : salesSummary ? `${formatToken(salesSummary.todaySales)} T` : "—"}
          </div>
          <Coins className="text-brand size-10 absolute top-6 right-5" />
          <div>ยอดรับชำระสำเร็จวันนี้</div>
        </div>

        <div className="border border-black/10 rounded-xl relative p-6 flex flex-col gap-5">
          <h6>รายการชำระเงิน</h6>
          <div className="text-5xl text-brand font-bold">
            {salesLoading ? "กำลังโหลด..." : salesSummary?.todayTransactions.toLocaleString("th-TH") ?? "—"}
          </div>
          <Receipt className="text-brand size-10 absolute top-6 right-5" />
          <div>จำนวนรายการที่ชำระสำเร็จวันนี้</div>
        </div>

      </div>

      {/* กราฟ + กล่องยอดขายสินค้า */}
      <div className="w-full flex flex-col lg:flex-row gap-5 px-4">
        {/* กล่องกราฟ */}
        <div className="w-full lg:w-2/3 min-w-0 border border-black/10 rounded-xl p-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium">แนวโน้มยอดขาย</h3>
                <div className="text-gray-500">
                  7 วันล่าสุด
                  {chartData.length > 0
                    ? ` · ${chartData[0].label}–${chartData[chartData.length - 1].label}`
                    : ""}
                </div>
              </div>
              <span className="text-sm font-semibold text-red-600">Token</span>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="text-4xl font-bold">
                {salesLoading ? "กำลังโหลด..." : salesSummary ? `${formatToken(salesSummary.weeklySales)} Token` : "—"}
              </div>
              <div className="text-sm text-gray-500">รวมยอดรับชำระสำเร็จในช่วงนี้</div>
            </div>

            {salesLoading ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                กำลังโหลดข้อมูลยอดขาย...
              </div>
            ) : salesError ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                ยังไม่สามารถแสดงกราฟได้
              </div>
            ) : salesSummary ? (
              <ChartContainer config={chartConfig} className="h-[260px] w-full">
                <BarChart data={chartData} margin={{ top: 24 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={({ x, y, payload, index }) => (
                      <text
                        x={x}
                        y={Number(y) + 10}
                        textAnchor="middle"
                        fontSize={12}
                        fill={index === lastIndex ? HIGHLIGHT : "#6b7280"}
                      >
                        {payload.value}
                      </text>
                    )}
                  />
                  <YAxis
                    domain={[0, "auto"]}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: number) => formatToken(value)}
                    width={56}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="sales" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={entry.date} fill={index === lastIndex ? HIGHLIGHT : LIGHT} />
                    ))}
                    <LabelList
                      dataKey="sales"
                      content={(props) => (
                        <text
                          x={Number(props.x) + Number(props.width) / 2}
                          y={Number(props.y) - 8}
                          textAnchor="middle"
                          fontSize={12}
                          fontWeight={props.index === lastIndex ? 700 : 400}
                          fill={props.index === lastIndex ? HIGHLIGHT : "#6b7280"}
                        >
                          {formatToken(Number(props.value))}
                        </text>
                      )}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : null}
          </div>
        </div>

        {/* กล่องยอดขายสินค้า */}
        <div className="w-full lg:w-1/3 min-w-0 border border-black/10 rounded-xl p-6">
          <div className="text-xl font-bold mb-2">ยอดขายสินค้า</div>

          {selectedStore?.product ? (
            <div className="w-full flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-brand">
                    {selectedStore.productImage ? (
                      <Image
                        src={selectedStore.productImage}
                        alt={selectedStore.product.title}
                        width={32}
                        height={32}
                        unoptimized
                        className="size-8 rounded-lg object-cover"
                      />
                    ) : (
                      <Coffee size={18} strokeWidth={2} />
                    )}
                  </span>
                  {selectedStore.product.title}
                </span>
                <span className="text-sm text-gray-500">
                  {formatToken(Number(selectedStore.product.price))} T
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">ร้านนี้ยังไม่มีสินค้า</p>
          )}
        </div>
      </div>

      {/* ตารางรายการรับชำระล่าสุด */}
      <div className="w-full border border-black/10 rounded-xl p-6 mx-auto max-w-full">
        <h2 className="text-lg font-bold mb-5">รายการรับชำระล่าสุด</h2>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-400 text-xs">
              <tr>
                <th className="px-3 py-3 font-medium">หมายเลขรายการ</th>
                <th className="px-3 py-3 font-medium">ลูกค้า</th>
                <th className="px-3 py-3 font-medium">เวลา</th>
                <th className="px-3 py-3 font-medium">สถานะ</th>
                <th className="px-3 py-3 font-medium text-right">ยอดชำระ</th>
              </tr>
            </thead>
            <tbody>
              {salesSummary?.recentTransactions.length ? (
                salesSummary.recentTransactions.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-4 font-medium">{item.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-3 py-4">{item.customerName ?? "ไม่พบข้อมูลผู้ซื้อ"}</td>
                    <td className="px-3 py-4 text-gray-500">
                      {transactionTimeFormat.format(new Date(item.createdAt))}
                    </td>
                    <td className="px-3 py-4">
                      <span className="rounded-full bg-green-50 text-green-700 px-3 py-1 text-xs">
                        สำเร็จ
                      </span>
                    </td>
                    <td className="px-3 py-4 text-right font-semibold">
                      +{formatToken(item.amount)} T
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                    {salesLoading
                      ? "กำลังโหลดรายการ..."
                      : salesError
                        ? "โหลดรายการชำระเงินไม่สำเร็จ"
                        : "ยังไม่มีรายการชำระเงิน"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}