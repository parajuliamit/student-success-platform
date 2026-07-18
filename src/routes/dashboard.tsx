import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { NotebookPen, School, TrendingUp, Users } from "lucide-react";
import { useMemo } from "react";
import { AtRiskTable } from "#/components/dashboard/at-risk-table";
import { AttendanceChart } from "#/components/dashboard/attendance-chart";
import { GradesChart } from "#/components/dashboard/grades-chart";
import { RiskChart } from "#/components/dashboard/risk-chart";
import { StatsCard } from "#/components/dashboard/stats-card";
import { DashboardLayout } from "#/components/layout/dashboard-layout";
import { useAuth } from "#/features/auth/auth-provider";
import { dashboardOverview } from "#/features/dashboard/mock-data";
import {
	buildCourseSummaries,
	buildDashboardStats,
	buildDashboardStudentRows,
	buildGradeByCoursePoints,
	buildLiveStudentSummaries,
	buildRiskDistribution,
} from "#/features/students/student-insights";
import {
	fetchRiskCalculations,
	fetchStudents,
} from "#/features/students/students-api";

export const Route = createFileRoute("/dashboard")({
	component: DashboardPage,
});

function DashboardPage() {
	const { token } = useAuth();

	const studentsQuery = useQuery({
		queryKey: ["students", token],
		queryFn: () => fetchStudents(token ?? ""),
		enabled: Boolean(token),
	});

	const riskQuery = useQuery({
		queryKey: ["risk-calculations", token],
		queryFn: () => fetchRiskCalculations(token ?? ""),
		enabled: Boolean(token),
	});

	const studentSummaries = useMemo(
		() =>
			buildLiveStudentSummaries(
				studentsQuery.data?.students ?? [],
				riskQuery.data?.risk_calculations ?? [],
			),
		[riskQuery.data?.risk_calculations, studentsQuery.data?.students],
	);

	const stats = useMemo(
		() => buildDashboardStats(studentSummaries),
		[studentSummaries],
	);
	const riskDistribution = useMemo(
		() => buildRiskDistribution(studentSummaries),
		[studentSummaries],
	);
	const gradeByClass = useMemo(
		() => buildGradeByCoursePoints(studentSummaries),
		[studentSummaries],
	);
	const attendanceTrend = dashboardOverview.attendanceTrend;
	const recentAtRiskStudents = useMemo(
		() =>
			buildDashboardStudentRows(studentSummaries)
				.filter((student) => student.riskLevel !== "low")
				.slice(0, 8),
		[studentSummaries],
	);
	const courseSummaries = useMemo(
		() => buildCourseSummaries(studentSummaries).slice(0, 4),
		[studentSummaries],
	);
	const isLoading = studentsQuery.isPending || riskQuery.isPending;

	return (
		<DashboardLayout
			title="Institutional Dashboard"
			description="A live operational view for academic staff to monitor student success, intervention risk, and course performance."
		>
			<div className="space-y-8">
				<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{isLoading ? null : (
						<>
							<StatsCard {...stats[0]} icon={<Users className="size-5" />} />
							<StatsCard {...stats[1]} icon={<School className="size-5" />} />
							<StatsCard
								{...stats[2]}
								icon={<TrendingUp className="size-5" />}
							/>
							<StatsCard
								{...stats[3]}
								icon={<NotebookPen className="size-5" />}
							/>
						</>
					)}
				</section>

				<section className="grid gap-4 xl:grid-cols-2">
					<AttendanceChart data={attendanceTrend} />
					<RiskChart data={riskDistribution} />
				</section>

				<section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
					<GradesChart data={gradeByClass} />
					<div className="space-y-4 rounded-xl border border-border/70 bg-card/90 p-4 shadow-sm">
						<div>
							<p className="text-sm font-semibold text-foreground">Overview</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Live student and risk data grouped by course from the backend.
							</p>
						</div>
						<div className="grid gap-3 sm:grid-cols-2">
							{courseSummaries.map((courseRecord) => (
								<div
									key={courseRecord.course}
									className="rounded-xl border border-border/60 bg-muted/25 p-4"
								>
									<p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
										{courseRecord.studentCount} learners
									</p>
									<p className="mt-1 font-medium text-foreground">
										{courseRecord.course}
									</p>
									<p className="mt-1 text-sm text-muted-foreground">
										{courseRecord.highRiskCount} high-risk student
										{courseRecord.highRiskCount === 1 ? "" : "s"}
									</p>
									<p className="mt-3 text-sm text-foreground">
										{courseRecord.averageAttendance.toFixed(1)}% avg attendance
										· {courseRecord.averageRisk.toFixed(1)}% avg risk
									</p>
								</div>
							))}
						</div>
					</div>
				</section>

				<AtRiskTable students={recentAtRiskStudents} />
			</div>
		</DashboardLayout>
	);
}
