import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { type ChartConfig } from "@/components/ui/chart";

// data
const chartData = [
  { time: "16:00", attendees: 78 },
  { time: "16:30", attendees: 210 },
  { time: "17:00", attendees: 396 },
  { time: "17:30", attendees: 564 },
  { time: "18:00", attendees: 642 },
  { time: "18:42", attendees: 684 },
];

const chartConfig = {
  attendees: {
    label: "ผู้เข้างาน",
    color: "#dc2626",
  },
} satisfies ChartConfig;

export function EnterEventCard() {
  return (
    <ChartContainer config={chartConfig} className="h-60 w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="time"
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
        <ChartLegend content={<ChartLegendContent />} className="text-[16px]" />

        <Bar
          dataKey="attendees"
          radius={[4, 4, 0, 0]}
          fill="var(--color-attendees)"
        />
      </BarChart>
    </ChartContainer>
  );
}
