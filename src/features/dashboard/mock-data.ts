import { faker } from '@faker-js/faker'
import type {
  DashboardOverview,
  DashboardClass,
  DashboardStudent,
  GradeByClassPoint,
  RiskDistributionPoint,
  RiskLevel,
} from '#/types/dashboard'

faker.seed(20260703)

const classTemplates = [
  'Computer Science A',
  'Data Science B',
  'Business Analytics A',
  'Psychology A',
  'Information Systems B',
  'Software Engineering A',
  'Mathematics B',
  'Engineering Foundation A',
  'Education Studies B',
  'Digital Media A',
]

const riskColors: Record<RiskLevel, string> = {
  low: 'hsl(162 48% 42%)',
  medium: 'hsl(42 92% 52%)',
  high: 'hsl(0 72% 55%)',
}

const classes: DashboardClass[] = classTemplates.map((name, index) => ({
  id: `CLS-${String(index + 1).padStart(3, '0')}`,
  name,
  instructor: faker.person.fullName(),
  averageGrade: faker.number.int({ min: 68, max: 92 }),
  studentCount: faker.number.int({ min: 18, max: 32 }),
}))

const students: DashboardStudent[] = Array.from({ length: 100 }, (_, index) => {
  const classRecord = faker.helpers.arrayElement(classes)
  const attendance = faker.number.int({ min: 61, max: 99 })
  const predictedScore = faker.number.int({ min: 42, max: 98 })
  const riskLevel: RiskLevel =
    attendance < 74 || predictedScore < 58
      ? 'high'
      : attendance < 84 || predictedScore < 71
        ? 'medium'
        : 'low'

  return {
    id: `STD-${String(index + 1).padStart(4, '0')}`,
    name: faker.person.fullName(),
    classId: classRecord.id,
    className: classRecord.name,
    attendance,
    predictedScore,
    riskLevel,
  }
})

const attendanceTrend = [
  { month: 'Feb', attendance: 83.2 },
  { month: 'Mar', attendance: 84.8 },
  { month: 'Apr', attendance: 85.7 },
  { month: 'May', attendance: 86.4 },
  { month: 'Jun', attendance: 87.1 },
  { month: 'Jul', attendance: 87.9 },
]

const gradeByClass: GradeByClassPoint[] = classes.map((classRecord) => ({
  className: classRecord.name,
  averageGrade: classRecord.averageGrade,
}))

const riskCounts = students.reduce<Record<RiskLevel, number>>(
  (counts, student) => {
    counts[student.riskLevel] += 1
    return counts
  },
  { low: 0, medium: 0, high: 0 }
)

const riskDistribution: RiskDistributionPoint[] = [
  { name: 'Low', value: riskCounts.low, fill: riskColors.low },
  { name: 'Medium', value: riskCounts.medium, fill: riskColors.medium },
  { name: 'High', value: riskCounts.high, fill: riskColors.high },
]

const recentAtRiskStudents = students
  .filter((student) => student.riskLevel !== 'low')
  .sort((first, second) => {
    const riskOrder: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2 }

    return (
      riskOrder[first.riskLevel] - riskOrder[second.riskLevel] ||
      first.attendance - second.attendance
    )
  })
  .slice(0, 8)

export const dashboardStats = [
  {
    label: 'Total Students',
    value: '1,248',
    change: '+12%',
    trend: 'up',
    description: 'Institution-wide enrollment this term',
  },
  {
    label: 'At-Risk Students',
    value: '86',
    change: '-5%',
    trend: 'down',
    description: 'Students needing intervention',
  },
  {
    label: 'Average Attendance',
    value: '87%',
    change: '+3%',
    trend: 'up',
    description: 'Six-month attendance average',
  },
  {
    label: 'Assignments Submitted',
    value: '3,412',
    change: '+18%',
    trend: 'up',
    description: 'Tracked submissions across classes',
  },
] satisfies DashboardOverview['stats']

export const dashboardOverview: DashboardOverview = {
  stats: dashboardStats,
  attendanceTrend,
  gradeByClass,
  riskDistribution,
  recentAtRiskStudents,
  students,
  classes,
}