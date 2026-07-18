import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { DashboardLayout } from "#/components/layout/dashboard-layout";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { useAuth } from "#/features/auth/auth-provider";
import { buildLiveStudentSummaries } from "#/features/students/student-insights";
import {
	fetchRiskCalculations,
	fetchStudents,
} from "#/features/students/students-api";

export const Route = createFileRoute("/predictions")({
	component: PredictionsPage,
});

function PredictionsPage() {
	const { token } = useAuth();
	const [sortKey, setSortKey] = useState<
		"name" | "course" | "attendance" | "risk"
	>("risk");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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

	const prioritizedStudents = useMemo(
		() =>
			buildLiveStudentSummaries(
				studentsQuery.data?.students ?? [],
				riskQuery.data?.risk_calculations ?? [],
			).sort((first, second) => {
				if (sortKey === "name") {
					return sortDirection === "asc"
						? first.name.localeCompare(second.name)
						: second.name.localeCompare(first.name);
				}

				if (sortKey === "course") {
					return sortDirection === "asc"
						? first.course.localeCompare(second.course)
						: second.course.localeCompare(first.course);
				}

				if (sortKey === "attendance") {
					return sortDirection === "asc"
						? first.attendance - second.attendance
						: second.attendance - first.attendance;
				}

				return sortDirection === "asc"
					? first.riskPercentage - second.riskPercentage
					: second.riskPercentage - first.riskPercentage;
			}),
		[
			riskQuery.data?.risk_calculations,
			sortDirection,
			sortKey,
			studentsQuery.data?.students,
		],
	);

	const toggleSort = (key: "name" | "course" | "attendance" | "risk") => {
		if (sortKey === key) {
			setSortDirection((currentDirection) =>
				currentDirection === "asc" ? "desc" : "asc",
			);
			return;
		}

		setSortKey(key);
		setSortDirection(key === "risk" ? "desc" : "asc");
	};

	return (
		<DashboardLayout
			title="Predictions"
			description="Forecast risk and likely intervention outcomes using the live backend risk scores."
		>
			<div className="rounded-xl border border-border/70 bg-card/90 p-4 shadow-sm">
				<div className="mb-4 flex items-start justify-between gap-3">
					<div>
						<h2 className="text-base font-semibold text-foreground">
							Risk Forecast Table
						</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Sortable list of students ordered by risk (highest first).
						</p>
					</div>
					<p className="text-xs text-muted-foreground">
						{prioritizedStudents.length} total students
					</p>
				</div>

				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 px-2"
									onClick={() => toggleSort("name")}
								>
									Name <ArrowUpDown className="ml-1 size-3.5" />
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 px-2"
									onClick={() => toggleSort("course")}
								>
									Course <ArrowUpDown className="ml-1 size-3.5" />
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 px-2"
									onClick={() => toggleSort("attendance")}
								>
									Attendance <ArrowUpDown className="ml-1 size-3.5" />
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 px-2"
									onClick={() => toggleSort("risk")}
								>
									Risk <ArrowUpDown className="ml-1 size-3.5" />
								</Button>
							</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{prioritizedStudents.map((student) => (
							<TableRow key={student.id}>
								<TableCell className="font-medium">{student.name}</TableCell>
								<TableCell>{student.course}</TableCell>
								<TableCell>{student.attendance.toFixed(1)}%</TableCell>
								<TableCell>{student.riskPercentage.toFixed(1)}%</TableCell>
								<TableCell>
									<Badge
										variant={
											student.riskLevel === "high"
												? "destructive"
												: student.riskLevel === "medium"
													? "secondary"
													: "outline"
										}
									>
										{student.riskLevel} risk
									</Badge>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</DashboardLayout>
	);
}
