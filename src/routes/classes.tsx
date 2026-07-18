import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { School } from "lucide-react";
import { useMemo } from "react";
import { DashboardLayout } from "#/components/layout/dashboard-layout";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { useAuth } from "#/features/auth/auth-provider";
import {
	buildCourseSummaries,
	buildLiveStudentSummaries,
} from "#/features/students/student-insights";
import {
	fetchRiskCalculations,
	fetchStudents,
} from "#/features/students/students-api";

export const Route = createFileRoute("/classes")({
	component: ClassesPage,
});

function ClassesPage() {
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

	const courseSummaries = useMemo(
		() =>
			buildCourseSummaries(
				buildLiveStudentSummaries(
					studentsQuery.data?.students ?? [],
					riskQuery.data?.risk_calculations ?? [],
				),
			),
		[riskQuery.data?.risk_calculations, studentsQuery.data?.students],
	);

	const averageClassSize =
		courseSummaries.length === 0
			? 0
			: courseSummaries.reduce((sum, course) => sum + course.studentCount, 0) /
				courseSummaries.length;
	const activeClasses = courseSummaries.length;
	const assessmentCoverage =
		courseSummaries.length === 0
			? 0
			: Math.round(
					(courseSummaries.filter(
						(course) => course.highRiskCount < course.studentCount,
					).length /
						courseSummaries.length) *
						100,
				);

	return (
		<DashboardLayout
			title="Classes"
			description="Track course-level attendance and risk progression from the live student API."
		>
			<section className="grid gap-4 md:grid-cols-3">
				<Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
					<CardHeader>
						<CardTitle>Active Classes</CardTitle>
						<CardDescription>
							Courses currently represented in the student registry.
						</CardDescription>
					</CardHeader>
					<CardContent className="text-3xl font-semibold">
						{activeClasses}
					</CardContent>
				</Card>
				<Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
					<CardHeader>
						<CardTitle>Average Class Size</CardTitle>
						<CardDescription>
							Computed from live course groupings.
						</CardDescription>
					</CardHeader>
					<CardContent className="text-3xl font-semibold">
						{Math.round(averageClassSize)}
					</CardContent>
				</Card>
				<Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
					<CardHeader>
						<CardTitle>Assessment Coverage</CardTitle>
						<CardDescription>
							Students with a live risk profile available.
						</CardDescription>
					</CardHeader>
					<CardContent className="text-3xl font-semibold">
						{assessmentCoverage}%
					</CardContent>
				</Card>
			</section>

			<Card className="mt-4 rounded-xl border-border/70 bg-card/90 shadow-sm">
				<CardHeader>
					<CardTitle>Class Management</CardTitle>
					<CardDescription>
						Course summaries derived from the live student and risk APIs.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-3 sm:grid-cols-3">
					{courseSummaries.slice(0, 3).map((course) => (
						<div
							key={course.course}
							className="rounded-xl border border-border/60 bg-muted/25 p-4"
						>
							<School className="size-5 text-primary" />
							<p className="mt-2 font-medium">{course.course}</p>
							<p className="mt-1 text-sm text-muted-foreground">
								{course.studentCount} students ·{" "}
								{course.averageAttendance.toFixed(1)}% attendance
							</p>
							<p className="mt-2 text-sm text-muted-foreground">
								{course.highRiskCount} high-risk student
								{course.highRiskCount === 1 ? "" : "s"}
							</p>
						</div>
					))}
				</CardContent>
			</Card>
		</DashboardLayout>
	);
}
