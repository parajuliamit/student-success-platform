import { createFileRoute } from '@tanstack/react-router'
import { School, ClipboardList, Users2 } from 'lucide-react'
import { DashboardLayout } from '#/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'

export const Route = createFileRoute('/classes')({
  component: ClassesPage,
})

function ClassesPage() {
  return (
    <DashboardLayout
      title="Classes"
      description="Track class-level attendance, assessment load, and grade progression."
    >
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Active Classes</CardTitle>
            <CardDescription>10 cohorts currently in session.</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">10</CardContent>
        </Card>
        <Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Average Class Size</CardTitle>
            <CardDescription>Balanced across departments.</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">24</CardContent>
        </Card>
        <Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Assessment Coverage</CardTitle>
            <CardDescription>Assignments and checkpoints monitored.</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">92%</CardContent>
        </Card>
      </section>

      <Card className="mt-4 rounded-xl border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Class Management</CardTitle>
          <CardDescription>Use this page for drill-downs when API data is connected.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-muted/25 p-4">
            <School className="size-5 text-primary" />
            <p className="mt-2 font-medium">Class performance</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/25 p-4">
            <Users2 className="size-5 text-primary" />
            <p className="mt-2 font-medium">Roster and staffing</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/25 p-4">
            <ClipboardList className="size-5 text-primary" />
            <p className="mt-2 font-medium">Assessment planning</p>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}