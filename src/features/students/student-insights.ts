import type {
	DashboardStat,
	RiskDistributionPoint,
	RiskLevel,
} from "#/types/dashboard";
import type { StudentRecord } from "./students-api";

export type LiveStudentSummary = StudentRecord & {
	attendance: number;
	riskScore: number;
	riskLevel: RiskLevel;
	displayId: string;
};

export interface CourseSummary {
	course: string;
	studentCount: number;
	averageAttendance: number;
	averageRiskScore: number;
	highRiskCount: number;
}

const riskColors: Record<RiskLevel, string> = {
	low: "hsl(162 48% 42%)",
	medium: "hsl(42 92% 52%)",
	high: "hsl(18 82% 54%)",
	critical: "hsl(0 72% 55%)",
};

export function getRiskLevel(riskScore: number): RiskLevel {
	const normalizedScore = Math.max(0, Math.min(3, Math.round(riskScore)));
	const riskLevels: RiskLevel[] = ["low", "medium", "high", "critical"];

	return riskLevels[normalizedScore];
}

export function buildLiveStudentSummaries(
	students: StudentRecord[],
): LiveStudentSummary[] {
	return students.map((student) => {
		const attendance = student.risk_profile?.attendance ?? 0;
		const riskScore = student.risk_profile?.risk_score ?? 0;

		return {
			...student,
			attendance,
			riskScore: Math.max(0, Math.min(3, riskScore)),
			riskLevel: getRiskLevel(riskScore),
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
		bucket.riskTotal += student.riskScore;
		bucket.highRiskCount +=
			student.riskLevel === "high" || student.riskLevel === "critical"
				? 1
				: 0;
		bucket.count += 1;
		groupedCourses.set(student.course, bucket);
	}

	return Array.from(groupedCourses.entries())
		.map(([course, bucket]) => ({
			course,
			studentCount: bucket.count,
			averageAttendance:
				bucket.count === 0 ? 0 : bucket.attendanceTotal / bucket.count,
			averageRiskScore:
				bucket.count === 0 ? 0 : bucket.riskTotal / bucket.count,
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

	const averageAssignmentSubmitted =
		students.length === 0
			? 0
			: students.reduce(
					(sum, student) =>
						sum + (student.risk_profile?.assignments ?? 0),
					0,
			  ) / students.length;

	const atRiskStudents = students.filter(
		(student) => student.riskLevel !== "low",
	).length;

	return [
		{
			label: "Total Students",
			value: String(students.length),
			description: "Total number of students in the system",
		},
		{
			label: "At-Risk Students",
			value: String(atRiskStudents),
			description: "Students at High or Critical risk levels",
		},
		{
			label: "Average Attendance",
			value: `${averageAttendance.toFixed(1)}%`,
			description: "Average attendance % across all students",
		},
		{
			label: "Average Assignment Submitted",
			value: averageAssignmentSubmitted.toFixed(2),
			description: "% of assignments submitted on average",
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
		{ low: 0, medium: 0, high: 0, critical: 0 },
	);

	return [
		{ name: "Low", value: counts.low, fill: riskColors.low },
		{ name: "Medium", value: counts.medium, fill: riskColors.medium },
		{ name: "High", value: counts.high, fill: riskColors.high },
		{ name: "Critical", value: counts.critical, fill: riskColors.critical },
	];
}

export function buildDashboardStudentRows(students: LiveStudentSummary[]) {
	return students.map((student) => ({
		id: student.displayId,
		name: student.name,
		classId: student.course,
		className: student.course,
		attendance: Number(student.attendance.toFixed(1)),
		riskScore: student.riskScore,
		riskLevel: student.riskLevel,
	}));
}
