import { Badge } from '#/components/ui/badge'
import { Card, CardContent } from '#/components/ui/card'
import type { DashboardStat } from '#/types/dashboard'

interface StatsCardProps extends DashboardStat {
  icon: React.ReactNode
}

export function StatsCard({
  icon,
  label,
  value,
  description,
}: StatsCardProps) {
  return (
    <Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}