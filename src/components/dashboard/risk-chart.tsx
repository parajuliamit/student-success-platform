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
import type { RiskDistributionPoint } from '#/types/dashboard'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

interface RiskChartProps {
  data: RiskDistributionPoint[]
}

export function RiskChart({ data }: RiskChartProps) {
  return (
    <Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Risk Distribution</CardTitle>
        <CardDescription>Breakdown of low, medium, and high risk students.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{}}
          className="h-[320px] w-full"
          initialDimension={{ width: 320, height: 320 }}
        >
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={68}
                outerRadius={104}
                paddingAngle={3}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip
                content={<ChartTooltipContent indicator="dot" formatter={(value) => `${value} students`} />}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          {data.map((entry) => (
            <div key={entry.name} className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: entry.fill }}
                />
                <span className="font-medium text-foreground">{entry.name}</span>
              </div>
              <div className="mt-2 text-xl font-semibold text-foreground">{entry.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}