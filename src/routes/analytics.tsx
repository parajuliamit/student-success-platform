import { createFileRoute } from '@tanstack/react-router'
import { BarChart3, LineChart, PieChart } from 'lucide-react'
import { DashboardLayout } from '#/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'

export const Route = createFileRoute('/analytics')({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  return (
    <DashboardLayout
      title="Analytics"
      description="Inspect trends, intervention effectiveness, and institutional performance signals."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Trend Analysis</CardTitle>
            <CardDescription>Attendance and performance over time.</CardDescription>
          </CardHeader>
          <CardContent><LineChart className="size-6 text-primary" /></CardContent>
        </Card>
        <Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Distribution Insights</CardTitle>
            <CardDescription>Risk spread across student cohorts.</CardDescription>
          </CardHeader>
          <CardContent><PieChart className="size-6 text-primary" /></CardContent>
        </Card>
        <Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Comparative Reporting</CardTitle>
            <CardDescription>Class and department comparisons.</CardDescription>
          </CardHeader>
          <CardContent><BarChart3 className="size-6 text-primary" /></CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}