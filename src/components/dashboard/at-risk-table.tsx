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
import { riskStyles } from '#/features/students/student-insights'

interface AtRiskTableProps {
  students: LiveStudentSummary[]
  onViewStudent: (student: LiveStudentSummary) => void
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
              <TableHead>Assignments</TableHead>
              <TableHead>Primary Risk Factor</TableHead>
              <TableHead>Risk Level</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium text-foreground">{student.displayId}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.course?.name ?? 'Unassigned'}</TableCell>
                <TableCell>{student.attendance}%</TableCell>
                <TableCell>{student.risk_profile?.assignments ?? 0}%</TableCell>
                <TableCell className="text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{student.primaryRiskFactor.factor}</span>
                    <span className="text-xs text-muted-foreground">{student.primaryRiskFactor.description}</span>
                  </div>
                </TableCell>
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