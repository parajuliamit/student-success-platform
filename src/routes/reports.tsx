import { createFileRoute } from '@tanstack/react-router'
import { FileText, Download, CalendarDays } from 'lucide-react'
import { DashboardLayout } from '#/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/reports')({
  component: ReportsPage,
})

function ReportsPage() {
  return (
    <DashboardLayout
      title="Reports"
      description="Generate summaries for staff meetings, intervention reviews, and leadership reporting."
    >
      <Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Reporting Center</CardTitle>
          <CardDescription>Ready for PDF and export workflows when APIs are connected.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-muted/25 p-4">
            <FileText className="size-5 text-primary" />
            <p className="mt-2 font-medium">Weekly summary</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/25 p-4">
            <CalendarDays className="size-5 text-primary" />
            <p className="mt-2 font-medium">Term review report</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/25 p-4">
            <Download className="size-5 text-primary" />
            <p className="mt-2 font-medium">Export archive</p>
          </div>
          <Button className="sm:col-span-3 rounded-xl">Create report</Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}