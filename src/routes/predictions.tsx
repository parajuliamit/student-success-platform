import { createFileRoute } from '@tanstack/react-router'
import { Brain, ShieldAlert, Sparkles } from 'lucide-react'
import { DashboardLayout } from '#/components/layout/dashboard-layout'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { dashboardOverview } from '#/features/dashboard/mock-data'

export const Route = createFileRoute('/predictions')({
  component: PredictionsPage,
})

function PredictionsPage() {
  const highPriorityStudents = dashboardOverview.students
    .filter((student) => student.riskLevel !== 'low')
    .sort((first, second) => first.predictedScore - second.predictedScore)
    .slice(0, 5)

  return (
    <DashboardLayout
      title="Predictions"
      description="Forecast risk, recovery, and likely intervention outcomes using model outputs."
    >
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Predictive Signals</CardTitle>
            <CardDescription>
              This section is ready for future model integration and score explanation layers.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-muted/25 p-4">
              <Brain className="size-5 text-primary" />
              <p className="mt-2 font-medium">Student risk scoring</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/25 p-4">
              <ShieldAlert className="size-5 text-primary" />
              <p className="mt-2 font-medium">Intervention prioritization</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/25 p-4">
              <Sparkles className="size-5 text-primary" />
              <p className="mt-2 font-medium">Explainable AI insights</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>High Priority Forecasts</CardTitle>
            <CardDescription>Students most likely to need intervention next.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {highPriorityStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3"
              >
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {student.className} · attendance {student.attendance}% · predicted {student.predictedScore}%
                  </p>
                </div>
                <Badge variant={student.riskLevel === 'high' ? 'destructive' : 'secondary'}>
                  {student.riskLevel} risk
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}