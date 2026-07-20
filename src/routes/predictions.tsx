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
import { fetchStudents } from "#/features/students/students-api";
import type { RiskLevel } from "#/types/dashboard";

export const Route = createFileRoute("/predictions")({
	component: PredictionsPage,
});

function PredictionsPage() {
	const { token } = useAuth();
	const [sortKey, setSortKey] = useState<
		"name" | "course" | "attendance" | "risk" | "assignments"
	>("risk");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

	const studentsQuery = useQuery({
		queryKey: ["students", token],
		queryFn: () => fetchStudents(token ?? ""),
		enabled: Boolean(token),
	});

	const prioritizedStudents = useMemo(
		() =>
			buildLiveStudentSummaries(studentsQuery.data?.students ?? []).sort((first, second) => {
				if (sortKey === "name") {
					return sortDirection === "asc"
						? first.name.localeCompare(second.name)
						: second.name.localeCompare(first.name);
				}

				if (sortKey === "course") {
					const firstCourseName = first.course?.name ?? "";
					const secondCourseName = second.course?.name ?? "";

					return sortDirection === "asc"
						? firstCourseName.localeCompare(secondCourseName)
						: secondCourseName.localeCompare(firstCourseName);
				}

				if (sortKey === "attendance") {
					return sortDirection === "asc"
						? first.attendance - second.attendance
						: second.attendance - first.attendance;
				}

				if (sortKey === "assignments") {
					const firstAssignments = first.risk_profile?.assignments ?? 0;
					const secondAssignments = second.risk_profile?.assignments ?? 0;

					return sortDirection === "asc"
						? firstAssignments - secondAssignments
						: secondAssignments - firstAssignments;
				}

				return sortDirection === "asc"
					? first.riskScore - second.riskScore
					: second.riskScore - first.riskScore;
			}),
		[sortDirection, sortKey, studentsQuery.data?.students],
	);

	const riskStyles: Record<RiskLevel, string> = {
	  low: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 uppercase',
	  medium: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 uppercase',
	  high: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 uppercase',
	  critical: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 uppercase',
	}

	const toggleSort = (key: "name" | "course" | "attendance" | "risk" | "assignments") => {
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
									onClick={() => toggleSort("assignments")}
								>
									Assignments <ArrowUpDown className="ml-1 size-3.5" />
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
						</TableRow>
					</TableHeader>
					<TableBody>
						{prioritizedStudents.map((student) => (
							<TableRow key={student.id}>
								<TableCell className="font-medium">{student.name}</TableCell>
								<TableCell>{student.course?.name ?? "Unassigned"}</TableCell>
								<TableCell>{student.attendance.toFixed(1)}%</TableCell>
								<TableCell>{student.risk_profile?.assignments ?? 0}%</TableCell>
								<TableCell>
									<Badge
										 variant="secondary" className={riskStyles[student.riskLevel]}
									>
										{student.riskLevel}
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
