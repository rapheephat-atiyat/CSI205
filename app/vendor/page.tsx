"use client"

import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ChartNoAxesCombined, Coins, Receipt } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";

const chartData = [
  { day: "15 ต.ค.", sales: 1980 },
  { day: "16 ต.ค.", sales: 2450 },
  { day: "17 ต.ค.", sales: 2200 },
  { day: "18 ต.ค.", sales: 2860 },
  { day: "19 ต.ค.", sales: 2680 },
  { day: "20 ต.ค.", sales: 3100 },
  { day: "21 ต.ค.", sales: 3480 },
];

const chartConfig = {
  sales: {
    label: "ยอดขาย (Token)",
    color: "#f8cdd2",
  },
} satisfies ChartConfig;

const HIGHLIGHT = "#e0313f";
const LIGHT = "#f8cdd2";
const total = chartData.reduce((sum, d) => sum + d.sales, 0); // 18,750
const lastIndex = chartData.length - 1;

function page() {
  return (
    <div className="flex flex-col gap-15">
      {/* ส่วนหัว */}
      <div className="flex items-center justify-between p-4">
        <div className="text-4xl font-bold">
          Vendor Dashboard
          <div className="text-sm text-gray-500">
            ภาพรวมยอดขายของ Good Day Café · ร้านค้า VND-008
          </div>
        </div>

        <Badge
          className="hover:cursor-pointer rounded-3xl p-5 bg-brand text-white text-sm"
          variant="secondary"
        >
          แสกนจ่ายสินค้า
        </Badge>
      </div>

      {/* การ์ดสรุป 3 ใบ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-15 mx-15">
        <div className="border border-black/10 rounded-xl relative p-6 flex flex-col gap-5">
          <h6>ยอดขายวันนี้</h6>
          <div className="text-5xl text-brand font-bold">3241 T</div>
          <Coins className="text-brand size-10 absolute top-6 right-5" />
          <div>12.3% จากเมื่อวาน</div>
        </div>

        <div className="border border-black/10 rounded-xl relative p-6 flex flex-col gap-5">
          <h6>รายการชำระเงิน</h6>
          <div className="text-5xl text-brand font-bold">42</div>
          <Receipt className="text-brand size-10 absolute top-6 right-5" />
          <div>ชำระสำเร็จทั้งหมด 42</div>
        </div>

        <div className="border border-black/10 rounded-xl relative p-6 flex flex-col gap-5">
          <h6>ยอดเฉลี่ยต่อรายการ</h6>
          <div className="text-5xl text-brand font-bold">28.6</div>
          <ChartNoAxesCombined className="text-brand size-10 absolute top-6 right-5" />
          <div>1 Token = 1 บาท</div>
        </div>
      </div>

      {/* กราฟ + กล่องขวา */}
      <div className="container mx-auto flex gap-5">
        <div className="min-w-2/3 border border-black/10 rounded-xl p-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium">แนวโน้มยอดขาย</h3>
                <div className="text-gray-500">7 วันล่าสุด · 15–21 ตุลาคม 2569</div>
              </div>
              <span className="text-sm font-semibold text-red-600">รายสัปดาห์ ˅</span>
            </div>

            <div className="flex items-end justify-between">
              <div className="text-4xl font-bold">{total.toLocaleString()} Token</div>
              <div className="text-sm text-green-700">↑ 18.6% จากสัปดาห์ก่อน</div>
            </div>

            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              <BarChart data={chartData} margin={{ top: 24 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="day"
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
                  domain={[0, 4000]}
                  ticks={[0, 2000, 4000]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v.toLocaleString()}
                  width={40}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />

                <Bar dataKey="sales" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i === lastIndex ? HIGHLIGHT : LIGHT} />
                  ))}
                  <LabelList
                    dataKey="sales"
                    content={({ x, y, width, value, index }: any) => (
                      <text
                        x={Number(x) + Number(width) / 2}
                        y={Number(y) - 8}
                        textAnchor="middle"
                        fontSize={12}
                        fontWeight={index === lastIndex ? 700 : 400}
                        fill={index === lastIndex ? HIGHLIGHT : "#6b7280"}
                      >
                        {Number(value).toLocaleString()}
                      </text>
                    )}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        <div className="border border-black/10 w-full rounded-xl p-6 text-2xl ">
            <div className="text-gray-500  text-xs"></div>
        </div>
      </div>
    </div>
  );
}

export default page;