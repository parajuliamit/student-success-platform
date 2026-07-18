import type {
	DashboardStat,
	GradeByClassPoint,
	RiskDistributionPoint,
	RiskLevel,
} from "#/types/dashboard";
import type { RiskCalculationRecord, StudentRecord } from "./students-api";

export type LiveStudentSummary = StudentRecord & {
	attendance: number;
	riskPercentage: number;
	riskLevel: RiskLevel;
	predictedScore: number;
	displayId: string;
};

export interface CourseSummary {
	course: string;
	studentCount: number;
	averageAttendance: number;
	averageRisk: number;
	highRiskCount: number;
}

const riskColors: Record<RiskLevel, string> = {
	low: "hsl(162 48% 42%)",
	medium: "hsl(42 92% 52%)",
	high: "hsl(0 72% 55%)",
};

export function getRiskLevel(
	attendance: number,
	riskPercentage: number,
): RiskLevel {
	if (riskPercentage >= 50 || attendance < 70) {
		return "high";
	}

	if (riskPercentage >= 25 || attendance < 85) {
		return "medium";
	}

	return "low";
}

export function buildLiveStudentSummaries(
	students: StudentRecord[],
	riskCalculations: RiskCalculationRecord[],
): LiveStudentSummary[] {
	return students.map((student) => {
		const attendance = student.risk_profile?.attendance ?? 0;
		const riskPercentage =
			riskCalculations.find(
				(calculation) =>
					calculation.risk_profile_id === student.risk_profile?.id,
			)?.risk_percentage ?? Math.max(0, 100 - attendance);

		return {
			...student,
			attendance,
			riskPercentage,
			riskLevel: getRiskLevel(attendance, riskPercentage),
			predictedScore: Math.max(0, Math.round(100 - riskPercentage)),
			displayId: `STD-${String(student.id).padStart(4, "0")}`,
		};
	});
}

export function buildCourseSummaries(
	students: LiveStudentSummary[],
): CourseSummary[] {
	const groupedCourses = new Map<
		string,
		{
			attendanceTotal: number;
			riskTotal: number;
			highRiskCount: number;
			count: number;
		}
	>();

	for (const student of students) {
		const bucket = groupedCourses.get(student.course) ?? {
			attendanceTotal: 0,
			riskTotal: 0,
			highRiskCount: 0,
			count: 0,
		};

		bucket.attendanceTotal += student.attendance;
		bucket.riskTotal += student.riskPercentage;
		bucket.highRiskCount += student.riskLevel === "high" ? 1 : 0;
		bucket.count += 1;
		groupedCourses.set(student.course, bucket);
	}

	return Array.from(groupedCourses.entries())
		.map(([course, bucket]) => ({
			course,
			studentCount: bucket.count,
			averageAttendance:
				bucket.count === 0 ? 0 : bucket.attendanceTotal / bucket.count,
			averageRisk: bucket.count === 0 ? 0 : bucket.riskTotal / bucket.count,
			highRiskCount: bucket.highRiskCount,
		}))
		.sort(
			(first, second) =>
				second.highRiskCount - first.highRiskCount ||
				second.studentCount - first.studentCount,
		);
}

export function buildDashboardStats(
	students: LiveStudentSummary[],
): DashboardStat[] {
	const averageAttendance =
		students.length === 0
			? 0
			: students.reduce((sum, student) => sum + student.attendance, 0) /
				students.length;

	const averageRisk =
		students.length === 0
			? 0
			: students.reduce((sum, student) => sum + student.riskPercentage, 0) /
				students.length;

	const atRiskStudents = students.filter(
		(student) => student.riskLevel !== "low",
	).length;

	return [
		{
			label: "Total Students",
			value: String(students.length),
			change: "live",
			trend: "up",
			description: "Current student records from the backend",
		},
		{
			label: "At-Risk Students",
			value: String(atRiskStudents),
			change: "live",
			trend: "down",
			description: "Students at medium or high risk",
		},
		{
			label: "Average Attendance",
			value: `${averageAttendance.toFixed(1)}%`,
			change: "live",
			trend: "up",
			description: "Attendance pulled from each risk profile",
		},
		{
			label: "Average Risk",
			value: `${averageRisk.toFixed(1)}%`,
			change: "live",
			trend: "down",
			description: "Average risk calculation across all students",
		},
	];
}

export function buildRiskDistribution(
	students: LiveStudentSummary[],
): RiskDistributionPoint[] {
	const counts = students.reduce<Record<RiskLevel, number>>(
		(accumulator, student) => {
			accumulator[student.riskLevel] += 1;
			return accumulator;
		},
		{ low: 0, medium: 0, high: 0 },
	);

	return [
		{ name: "Low", value: counts.low, fill: riskColors.low },
		{ name: "Medium", value: counts.medium, fill: riskColors.medium },
		{ name: "High", value: counts.high, fill: riskColors.high },
	];
}

export function buildGradeByCoursePoints(
	students: LiveStudentSummary[],
): GradeByClassPoint[] {
	return buildCourseSummaries(students).map((courseSummary) => ({
		className: courseSummary.course,
		averageGrade: Math.max(0, Math.round(100 - courseSummary.averageRisk)),
	}));
}

export function buildDashboardStudentRows(students: LiveStudentSummary[]) {
	return students.map((student) => ({
		id: student.displayId,
		name: student.name,
		classId: student.course,
		className: student.course,
		attendance: Number(student.attendance.toFixed(1)),
		predictedScore: student.predictedScore,
		riskLevel: student.riskLevel,
	}));
}
