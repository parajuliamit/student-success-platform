import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowRight,
	CalendarDays,
	GraduationCap,
	MapPin,
	Search,
	ShieldAlert,
	Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { DashboardLayout } from "#/components/layout/dashboard-layout";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import { useAuth } from "#/features/auth/auth-provider";
import {
	fetchRiskCalculations,
	fetchStudents,
	type StudentRecord,
} from "#/features/students/students-api";

type StudentRiskLevel = "low" | "medium" | "high";

export const Route = createFileRoute("/students")({
	component: StudentsPage,
});

function StudentsPage() {
	const { token } = useAuth();
	const [search, setSearch] = useState("");

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

	const students = studentsQuery.data?.students ?? [];
	const riskCalculations = riskQuery.data?.risk_calculations ?? [];

	const studentRows = useMemo(
		() =>
			students.map((student) => {
				const attendance = student.risk_profile?.attendance ?? 0;
				const riskPercentage =
					riskCalculations.find(
						(calculation) =>
							calculation.risk_profile_id === student.risk_profile?.id,
					)?.risk_percentage ?? Math.max(0, 100 - attendance);

				const riskLevel: StudentRiskLevel =
					riskPercentage >= 50 || attendance < 70
						? "high"
						: riskPercentage >= 25 || attendance < 85
							? "medium"
							: "low";

				return {
					...student,
					attendance,
					riskPercentage,
					riskLevel,
				};
			}),
		[riskCalculations, students],
	);

	const filteredStudents = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		if (!normalizedSearch) {
			return studentRows;
		}

		return studentRows.filter((student) => {
			const haystack = [
				student.name,
				student.banner_id,
				student.course,
				student.city,
				student.state,
				student.personal_email,
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();

			return haystack.includes(normalizedSearch);
		});
	}, [search, studentRows]);

	const atRiskStudents = useMemo(
		() =>
			filteredStudents
				.filter((student) => student.riskLevel !== "low")
				.sort((first, second) => second.riskPercentage - first.riskPercentage)
				.slice(0, 4),
		[filteredStudents],
	);

	const totalStudents = students.length;
	const highRiskStudents = studentRows.filter(
		(student) => student.riskLevel === "high",
	).length;
	const mediumRiskStudents = studentRows.filter(
		(student) => student.riskLevel === "medium",
	).length;
	const averageAttendance =
		studentRows.length === 0
			? 0
			: studentRows.reduce((sum, student) => sum + student.attendance, 0) /
				studentRows.length;

	const isLoading = studentsQuery.isPending || riskQuery.isPending;
	const isError = studentsQuery.isError || riskQuery.isError;
	const errorMessage =
		studentsQuery.error?.message ??
		riskQuery.error?.message ??
		"Unable to load students.";

	const formatDate = (value: string | null) => {
		if (!value) {
			return "Not available";
		}

		return new Intl.DateTimeFormat("en", {
			month: "short",
			day: "numeric",
			year: "numeric",
		}).format(new Date(value));
	};

	const formatLocation = (student: StudentRecord) => {
		const parts = [student.city, student.state, student.country].filter(
			Boolean,
		);
		return parts.length > 0 ? parts.join(", ") : "Location unavailable";
	};

	const renderValue = (value: number) => `${value.toFixed(1)}%`;

	return (
		<DashboardLayout
			title="Students"
			description="Review live student records, attendance signals, and current risk calculations."
		>
			<div className="space-y-4">
				<div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
					<Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
						<CardHeader>
							<CardTitle>Student Registry</CardTitle>
							<CardDescription>
								Live roster and risk status pulled from the backend.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
							{isLoading ? (
								<>
									<RegistrySkeleton />
									<RegistrySkeleton />
									<RegistrySkeleton />
									<RegistrySkeleton />
								</>
							) : (
								<>
									<div className="rounded-xl border border-border/60 bg-muted/30 p-4">
										<GraduationCap className="size-5 text-primary" />
										<p className="mt-3 text-2xl font-semibold">
											{totalStudents}
										</p>
										<p className="text-sm text-muted-foreground">
											Total students
										</p>
									</div>
									<div className="rounded-xl border border-border/60 bg-muted/30 p-4">
										<Users className="size-5 text-primary" />
										<p className="mt-3 text-2xl font-semibold">
											{mediumRiskStudents}
										</p>
										<p className="text-sm text-muted-foreground">
											Medium risk profiles
										</p>
									</div>
									<div className="rounded-xl border border-border/60 bg-muted/30 p-4">
										<ShieldAlert className="size-5 text-primary" />
										<p className="mt-3 text-2xl font-semibold">
											{highRiskStudents}
										</p>
										<p className="text-sm text-muted-foreground">
											High risk profiles
										</p>
									</div>
									<div className="rounded-xl border border-border/60 bg-muted/30 p-4">
										<CalendarDays className="size-5 text-primary" />
										<p className="mt-3 text-2xl font-semibold">
											{renderValue(averageAttendance)}
										</p>
										<p className="text-sm text-muted-foreground">
											Average attendance
										</p>
									</div>
								</>
							)}
						</CardContent>
					</Card>

					<Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
						<CardHeader>
							<CardTitle>Action Queue</CardTitle>
							<CardDescription>
								Students needing the fastest follow-up based on live scores.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3">
								<div>
									<p className="font-medium">Attendance review</p>
									<p className="text-sm text-muted-foreground">
										Flag students below 75% attendance.
									</p>
								</div>
								<Badge variant="secondary">
									{
										studentRows.filter((student) => student.attendance < 75)
											.length
									}{" "}
									pending
								</Badge>
							</div>
							<div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3">
								<div>
									<p className="font-medium">Risk calculation review</p>
									<p className="text-sm text-muted-foreground">
										Prioritize students above 50% risk.
									</p>
								</div>
								<Badge variant="secondary">
									{
										studentRows.filter(
											(student) => student.riskPercentage >= 50,
										).length
									}{" "}
									pending
								</Badge>
							</div>
							<div className="space-y-3">
								{atRiskStudents.map((student) => (
									<div
										key={student.id}
										className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3"
									>
										<div>
											<p className="font-medium">{student.name}</p>
											<p className="text-sm text-muted-foreground">
												{student.course} · {student.attendance.toFixed(1)}%
												attendance · {student.riskPercentage.toFixed(1)}% risk
											</p>
										</div>
										<Badge
											variant={
												student.riskLevel === "high"
													? "destructive"
													: "secondary"
											}
										>
											{student.riskLevel} risk
										</Badge>
									</div>
								))}
							</div>
							<Button className="w-full rounded-xl">
								Open student profile <ArrowRight className="size-4" />
							</Button>
						</CardContent>
					</Card>
				</div>

				<Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
					<CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<CardTitle>Student Directory</CardTitle>
							<CardDescription>
								Search by name, banner ID, course, or location to inspect the
								live API payload.
							</CardDescription>
						</div>
						<div className="w-full sm:max-w-sm">
							<div className="relative">
								<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									className="pl-9"
									placeholder="Search students"
								/>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{isError ? (
							<div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
								{errorMessage}
							</div>
						) : null}

						{!isError && !isLoading ? (
							<div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
								{filteredStudents.map((student) => (
									<article
										key={student.id}
										className="rounded-2xl border border-border/60 bg-muted/20 p-4 shadow-sm transition-colors hover:bg-muted/30"
									>
										<div className="flex items-start justify-between gap-3">
											<div>
												<p className="text-sm font-semibold text-foreground">
													{student.name}
												</p>
												<p className="mt-1 text-sm text-muted-foreground">
													{student.banner_id} · Joined {student.joined_year}
												</p>
											</div>
											<Badge
												variant={
													student.riskLevel === "high"
														? "destructive"
														: "secondary"
												}
											>
												{student.riskLevel}
											</Badge>
										</div>

										<div className="mt-4 grid gap-2 text-sm text-muted-foreground">
											<div className="flex items-center gap-2">
												<MapPin className="size-4 shrink-0" />
												<span>{formatLocation(student)}</span>
											</div>
											<div className="flex items-center gap-2">
												<CalendarDays className="size-4 shrink-0" />
												<span>
													Birth date: {formatDate(student.date_of_birth)}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<ShieldAlert className="size-4 shrink-0" />
												<span>
													Attendance {student.attendance.toFixed(1)}% · Risk{" "}
													{student.riskPercentage.toFixed(1)}%
												</span>
											</div>
										</div>

										<div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4 text-sm text-muted-foreground">
											<div>
												<p className="font-medium text-foreground">
													{student.course}
												</p>
												<p>{student.personal_email ?? "No email on record"}</p>
											</div>
											<Button
												variant="outline"
												size="sm"
												className="rounded-xl"
											>
												View
											</Button>
										</div>
									</article>
								))}
							</div>
						) : null}

						{!isLoading && filteredStudents.length === 0 && !isError ? (
							<div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
								No students match the current search.
							</div>
						) : null}
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
}

function RegistrySkeleton() {
	return (
		<div className="rounded-xl border border-border/60 bg-muted/30 p-4">
			<Skeleton className="size-5 rounded-full" />
			<Skeleton className="mt-3 h-8 w-20" />
			<Skeleton className="mt-2 h-4 w-24" />
		</div>
	);
}
