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
import type { LiveStudentSummary } from '#/features/students/student-insights'
import type { RiskLevel } from '#/types/dashboard'

interface AtRiskTableProps {
  students: LiveStudentSummary[]
  onViewStudent: (student: LiveStudentSummary) => void
}

const riskStyles: Record<RiskLevel, string> = {
  low: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 uppercase',
  medium: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 uppercase',
  high: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 uppercase',
  critical: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 uppercase',
}

export function AtRiskTable({ students, onViewStudent }: AtRiskTableProps) {
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
              <TableHead>Risk Level</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium text-foreground">{student.displayId}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.course}</TableCell>
                <TableCell>{student.attendance}%</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={riskStyles[student.riskLevel]}>
                    {student.riskLevel}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => onViewStudent(student)}>
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