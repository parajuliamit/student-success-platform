import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '#/components/ui/chart'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import type { GradeByClassPoint } from '#/types/dashboard'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

const chartConfig = {
  grade: {
    label: 'Average grade',
    color: 'hsl(var(--chart-2))',
  },
} as const

interface GradesChartProps {
  data: GradeByClassPoint[]
}

export function GradesChart({ data }: GradesChartProps) {
  return (
    <Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Average Grade by Class</CardTitle>
        <CardDescription>Teaching performance across the 10 active classes.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <BarChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="className"
              axisLine={false}
              tickLine={false}
              tickMargin={12}
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={<ChartTooltipContent indicator="dot" formatter={(value) => `${value}%`} />}
            />
            <Bar dataKey="averageGrade" radius={[8, 8, 0, 0]} fill="var(--color-grade)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}