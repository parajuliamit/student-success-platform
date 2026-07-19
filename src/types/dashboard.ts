export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface DashboardStudent {
  id: string
  name: string
  classId: string
  className: string
  attendance: number
  riskScore: number
  riskLevel: RiskLevel
}

export interface DashboardClass {
  id: string
  name: string
  instructor: string
  studentCount: number
}

export interface AttendanceTrendPoint {
  month: string
  attendance: number
}

export interface RiskDistributionPoint {
  name: string
  value: number
  fill: string
}

export interface DashboardStat {
  label: string
  value: string
  description: string
}

export interface DashboardOverview {
  stats: DashboardStat[]
  attendanceTrend: AttendanceTrendPoint[]
  riskDistribution: RiskDistributionPoint[]
  recentAtRiskStudents: DashboardStudent[]
  students: DashboardStudent[]
  classes: DashboardClass[]
}