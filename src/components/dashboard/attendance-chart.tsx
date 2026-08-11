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
import type { AttendanceTrendPoint } from '#/types/dashboard'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

const chartConfig = {
  attendance: {
    label: 'Attendance',
    color: 'hsl(var(--chart-4))',
  },
} as const

interface AttendanceChartProps {
  data: AttendanceTrendPoint[]
}

export function AttendanceChart({ data }: AttendanceChartProps) {
  return (
    <Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Attendance Trend</CardTitle>
        <CardDescription>Average attendance across the last 6 months.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tickMargin={12}
            />
            <YAxis
              domain={[75, 100]}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value) => `${Number(value).toFixed(1)}%`}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="attendance"
              stroke="var(--color-attendance)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}