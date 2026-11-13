"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatWeight } from "@/core/format/format";
import type { DailyCollection } from "@/features/dashboard/data/models";

const config = {
  collectedKg: { label: "Collected", color: "var(--chart-1)" },
} satisfies ChartConfig;

const dayLabel = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** Kilograms weighed per day for the last 14 days. */
export function CollectionsChart({ daily }: { daily: DailyCollection[] }) {
  const data = daily.map((day) => ({
    ...day,
    // Date keys are Colombo dates already; format them without shifting.
    label: dayLabel.format(new Date(`${day.date}T00:00:00Z`)),
  }));

  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={60}
          tickFormatter={(kg: number) => `${kg} kg`}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => (
                <div className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">
                    {item.payload.pickups} pickups
                  </span>
                  <span className="font-mono font-semibold">
                    {formatWeight(Number(value), 1)}
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar
          dataKey="collectedKg"
          fill="var(--color-collectedKg)"
          radius={[6, 6, 0, 0]}
          animationDuration={400}
        />
      </BarChart>
    </ChartContainer>
  );
}
