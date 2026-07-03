export type RiskLevel = 'low' | 'medium' | 'high'

export interface DashboardStudent {
  id: string
  name: string
  classId: string
  className: string
  attendance: number
  predictedScore: number
  riskLevel: RiskLevel
}

export interface DashboardClass {
  id: string
  name: string
  instructor: string
  averageGrade: number
  studentCount: number
}

export interface AttendanceTrendPoint {
  month: string
  attendance: number
}

export interface GradeByClassPoint {
  className: string
  averageGrade: number
}

export interface RiskDistributionPoint {
  name: string
  value: number
  fill: string
}

export interface DashboardStat {
  label: string
  value: string
  change: string
  trend: 'up' | 'down'
  description: string
}

export interface DashboardOverview {
  stats: DashboardStat[]
  attendanceTrend: AttendanceTrendPoint[]
  gradeByClass: GradeByClassPoint[]
  riskDistribution: RiskDistributionPoint[]
  recentAtRiskStudents: DashboardStudent[]
  students: DashboardStudent[]
  classes: DashboardClass[]
}