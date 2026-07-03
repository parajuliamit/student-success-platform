import { createFileRoute } from '@tanstack/react-router'
import { GraduationCap, Users, ShieldAlert, ArrowRight } from 'lucide-react'
import { DashboardLayout } from '#/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { dashboardOverview } from '#/features/dashboard/mock-data'

export const Route = createFileRoute('/students')({
  component: StudentsPage,
})

function StudentsPage() {
  const students = dashboardOverview.students
  const atRiskStudents = students
    .filter((student) => student.riskLevel !== 'low')
    .sort((first, second) => first.attendance - second.attendance)
    .slice(0, 4)

  return (
    <DashboardLayout
      title="Students"
      description="Review student profiles, cohort patterns, attendance signals, and intervention status."
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Student Registry</CardTitle>
            <CardDescription>Centralized view for enrollment and progress monitoring.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
              <GraduationCap className="size-5 text-primary" />
              <p className="mt-3 text-2xl font-semibold">1,248</p>
              <p className="text-sm text-muted-foreground">Total learners</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
              <Users className="size-5 text-primary" />
              <p className="mt-3 text-2xl font-semibold">{students.length}</p>
              <p className="text-sm text-muted-foreground">Mock student profiles</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
              <ShieldAlert className="size-5 text-primary" />
              <p className="mt-3 text-2xl font-semibold">{atRiskStudents.length}</p>
              <p className="text-sm text-muted-foreground">At-risk learners in view</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Action Queue</CardTitle>
            <CardDescription>Quick next steps for staff intervention planning.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3">
              <div>
                <p className="font-medium">Attendance review</p>
                <p className="text-sm text-muted-foreground">Flag students below 75% attendance.</p>
              </div>
              <Badge variant="secondary">{atRiskStudents.filter((student) => student.attendance < 75).length} pending</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3">
              <div>
                <p className="font-medium">Predicted score follow-up</p>
                <p className="text-sm text-muted-foreground">Prioritize students under intervention threshold.</p>
              </div>
              <Badge variant="secondary">{atRiskStudents.filter((student) => student.predictedScore < 60).length} pending</Badge>
            </div>
            <div className="space-y-3">
              {atRiskStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3"
                >
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.className} · {student.attendance}% attendance · {student.predictedScore}% predicted
                    </p>
                  </div>
                  <Badge variant={student.riskLevel === 'high' ? 'destructive' : 'secondary'}>
                    {student.riskLevel} risk
                  </Badge>
                </div>
              ))}
            </div>
            <Button className="w-full rounded-xl">
              Open student profile <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}