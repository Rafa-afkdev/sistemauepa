"use client"

import { Bar, BarChart, CartesianGrid, Cell, XAxis } from "recharts"

import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A bar chart"

interface GradesChartProps {
  data: {
    subject: string
    average: number
  }[]
}

const chartConfig = {
  average: {
    label: "Promedio",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function GradesChart({ data }: GradesChartProps) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="subject"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="average" radius={4}>
            {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`var(--chart-${(index % 5) + 1})`} />
            ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
