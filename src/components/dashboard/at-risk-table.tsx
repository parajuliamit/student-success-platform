import { Badge } from '#/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { Button } from '#/components/ui/button'
import type { DashboardStudent, RiskLevel } from '#/types/dashboard'

interface AtRiskTableProps {
  students: DashboardStudent[]
}

const riskStyles: Record<RiskLevel, string> = {
  low: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  medium: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  high: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

export function AtRiskTable({ students }: AtRiskTableProps) {
  return (
    <Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Recent At-Risk Students</CardTitle>
        <CardDescription>
          Students with the strongest intervention signals this week.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>Predicted Score</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium text-foreground">{student.id}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.className}</TableCell>
                <TableCell>{student.attendance}%</TableCell>
                <TableCell>{student.predictedScore}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={riskStyles[student.riskLevel]}>
                    {student.riskLevel}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}