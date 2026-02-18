"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "An area chart with gradient fill"

const chartConfig = {
  average: {
    label: "Promedio",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

interface AreaChartGradientProps {
  data: {
    subject: string
    average: number
  }[]
}

export function AreaChartGradient({ data }: AreaChartGradientProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento General</CardTitle>
        <CardDescription>
          Visualización de promedios por asignatura
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="subject"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="fillAverage" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-average)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-average)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="average"
              type="natural"
              fill="url(#fillAverage)"
              fillOpacity={0.4}
              stroke="var(--color-average)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              Tendencia de notas <TrendingUp className="h-4 w-4" />
            </div>
            {/* <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Resumen del corte actual
            </div> */}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
