import { createFileRoute } from '@tanstack/react-router'
import { Users, School, TrendingUp, NotebookPen } from 'lucide-react'
import { DashboardLayout } from '#/components/layout/dashboard-layout'
import { StatsCard } from '#/components/dashboard/stats-card'
import { AttendanceChart } from '#/components/dashboard/attendance-chart'
import { GradesChart } from '#/components/dashboard/grades-chart'
import { RiskChart } from '#/components/dashboard/risk-chart'
import { AtRiskTable } from '#/components/dashboard/at-risk-table'
import { dashboardOverview } from '#/features/dashboard/mock-data'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { stats, attendanceTrend, gradeByClass, riskDistribution, recentAtRiskStudents } =
    dashboardOverview

  return (
    <DashboardLayout
      title="Institutional Dashboard"
      description="A single operational view for academic staff to monitor student success, intervention risk, and class performance."
    >
      <div className="space-y-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            {...stats[0]}
            icon={<Users className="size-5" />}
          />
          <StatsCard
            {...stats[1]}
            icon={<School className="size-5" />}
          />
          <StatsCard
            {...stats[2]}
            icon={<TrendingUp className="size-5" />}
          />
          <StatsCard
            {...stats[3]}
            icon={<NotebookPen className="size-5" />}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <AttendanceChart data={attendanceTrend} />
          <RiskChart data={riskDistribution} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          <GradesChart data={gradeByClass} />
          <div className="space-y-4 rounded-xl border border-border/70 bg-card/90 p-4 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-foreground">Overview</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Mock institutional data generated with Faker for demonstration and UX prototyping.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {dashboardOverview.classes.slice(0, 4).map((classRecord) => (
                <div key={classRecord.id} className="rounded-xl border border-border/60 bg-muted/25 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {classRecord.id}
                  </p>
                  <p className="mt-1 font-medium text-foreground">{classRecord.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{classRecord.instructor}</p>
                  <p className="mt-3 text-sm text-foreground">
                    {classRecord.studentCount} students · {classRecord.averageGrade}% avg grade
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <AtRiskTable students={recentAtRiskStudents} />
      </div>
    </DashboardLayout>
  )
}