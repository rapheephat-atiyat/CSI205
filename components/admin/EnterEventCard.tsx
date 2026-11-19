import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { type ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  attendees: {
    label: "ผู้เข้างาน",
    color: "#dc2626",
  },
} satisfies ChartConfig;

export function EnterEventCard({ data }: { data: { time: string; attendees: number }[] }) {
  if (!data.length) return <p className="flex h-60 items-center justify-center text-sm text-muted-foreground">ยังไม่มีข้อมูลเช็กอิน</p>;
  return (
    <ChartContainer config={chartConfig} className="h-60 w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="time"
          tickFormatter={(time: string) => time.slice(-5)}
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="line"
              labelClassName="text-[16px] font-semibold"
            />
          }
        />
        <ChartLegend content={<ChartLegendContent className="text-[16px]" />} />

        <Bar
          dataKey="attendees"
          radius={[4, 4, 0, 0]}
          fill="var(--color-attendees)"
        />
      </BarChart>
    </ChartContainer>
  );
}
