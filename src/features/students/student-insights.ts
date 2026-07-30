import type {
	DashboardStat,
	RiskDistributionPoint,
	RiskLevel,
} from "#/types/dashboard";
import type { StudentRecord, StudentRiskProfile } from "./students-api";

export interface PrimaryRiskFactor {
	factor: string;
	description: string;
	severity: "low" | "medium" | "high" | "critical";
}

export type LiveStudentSummary = StudentRecord & {
	attendance: number;
	riskScore: number;
	riskLevel: RiskLevel;
	displayId: string;
	primaryRiskFactor: PrimaryRiskFactor;
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

export function getPrimaryRiskFactor(profile: StudentRiskProfile | null): PrimaryRiskFactor {
	if (!profile) {
		return {
			factor: "Unknown",
			description: "No risk profile data available",
			severity: "low",
		};
	}

	// Analyze each risk factor and score them based on the actual database schema
	const factors: Array<{ factor: string; description: string; score: number }> = [];

	// Low attendance is a major risk factor (0-100%)
	if (profile.attendance < 70) {
		factors.push({
			factor: "Attendance",
			description: `Low attendance at ${profile.attendance.toFixed(1)}%`,
			score: Math.max(1, (70 - profile.attendance) / 10),
		});
	}

	// Low assignment submission (0-100%)
	if (profile.assignments < 60) {
		factors.push({
			factor: "Assignments",
			description: `Only ${profile.assignments.toFixed(1)}% of assignments submitted`,
			score: Math.max(1, (60 - profile.assignments) / 8),
		});
	}

	// High stress level (0, 1, 2)
	if (profile.stress_level === 2) {
		factors.push({
			factor: "Stress Level",
			description: "High stress level impacting academic performance",
			score: 2.5,
		});
	} else if (profile.stress_level === 1) {
		factors.push({
			factor: "Stress Level",
			description: "Moderate stress affecting studies",
			score: 1.2,
		});
	}

	// Low motivation (0, 1, 2)
	if (profile.motivation === 0) {
		factors.push({
			factor: "Motivation",
			description: "Very low motivation to complete coursework",
			score: 2.8,
		});
	} else if (profile.motivation === 1) {
		factors.push({
			factor: "Motivation",
			description: "Moderate motivation levels",
			score: 1,
		});
	}

	// Insufficient study hours (actual hours per week)
	if (profile.study_hours < 5) {
		factors.push({
			factor: "Study Hours",
			description: `Only ${profile.study_hours.toFixed(1)} hours of study per week`,
			score: Math.max(1, (5 - profile.study_hours) * 0.8),
		});
	}

	// Limited learning resources (0, 1, 2)
	if (profile.resources === 0) {
		factors.push({
			factor: "Learning Resources",
			description: "No access to adequate learning resources",
			score: 2.6,
		});
	} else if (profile.resources === 1) {
		factors.push({
			factor: "Learning Resources",
			description: "Limited access to learning resources",
			score: 1.3,
		});
	}

	// No internet connectivity (0 or 1)
	if (profile.internet === 0) {
		factors.push({
			factor: "Internet Access",
			description: "No reliable internet access for online learning",
			score: 3,
		});
	}

	// Not engaging in discussions (0 or 1)
	if (profile.discussions === 0) {
		factors.push({
			factor: "Class Engagement",
			description: "Not participating in class discussions",
			score: 1.1,
		});
	}

	// No extracurricular involvement (0 or 1)
	if (profile.extracurricular === 0) {
		factors.push({
			factor: "Extracurricular Engagement",
			description: "No involvement in extracurricular activities",
			score: 0.6,
		});
	}

	// No education technology usage (0 or 1)
	if (profile.education_technology === 0) {
		factors.push({
			factor: "Technology Adoption",
			description: "Limited use of educational technology tools",
			score: 0.8,
		});
	}

	// Low online course engagement (0-20 courses)
	if (profile.online_courses < 1) {
		factors.push({
			factor: "Online Learning",
			description: "No engagement with online learning platforms",
			score: 0.7,
		});
	}

	// Find the most impactful factor
	if (factors.length === 0) {
		return {
			factor: "Overall Good",
			description: "No significant risk factors identified",
			severity: "low",
		};
	}

	const topFactor = factors.reduce((prev, current) =>
		prev.score > current.score ? prev : current,
	);

	// Determine severity based on the score
	let severity: "low" | "medium" | "high" | "critical" = "low";
	if (topFactor.score > 2.5) severity = "critical";
	else if (topFactor.score > 1.8) severity = "high";
	else if (topFactor.score > 1) severity = "medium";

	return {
		factor: topFactor.factor,
		description: topFactor.description,
		severity,
	};
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
			primaryRiskFactor: getPrimaryRiskFactor(student.risk_profile),
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
		const courseName = student.course?.name ?? "Unassigned";
		const bucket = groupedCourses.get(courseName) ?? {
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
		groupedCourses.set(courseName, bucket);
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
		courseId: student.course?.name ?? "Unassigned",
		courseName: student.course?.name ?? "Unassigned",
		attendance: Number(student.attendance.toFixed(1)),
		riskScore: student.riskScore,
		riskLevel: student.riskLevel,
	}));
}
