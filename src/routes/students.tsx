import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	CalendarDays,
	MapPin,
	PencilLine,
	Plus,
	Search,
	ShieldAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import { StudentFormDialog } from "#/components/students/student-form-dialog";
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
import { useAuth } from "#/features/auth/auth-provider";
import {
	createStudent,
	fetchStudents,
	type StudentMutationInput,
	type StudentRecord,
	updateStudent,
} from "#/features/students/students-api";
import {
	buildStudentPayload,
	createEmptyStudentFormValues,
	createStudentFormValues,
	type StudentFormMode,
	type StudentFormValues,
} from "#/features/students/student-form";
import { getRiskLevel } from "#/features/students/student-insights";

type StudentRiskLevel = "low" | "medium" | "high" | "critical";

export const Route = createFileRoute("/students")({
	component: StudentsPage,
});

function StudentsPage() {
	const { token } = useAuth();
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [formMode, setFormMode] = useState<StudentFormMode>("create");
	const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
		null,
	);
	const [formValues, setFormValues] = useState<StudentFormValues>(
		createEmptyStudentFormValues(),
	);
	const [formError, setFormError] = useState<string | null>(null);

	const studentsQuery = useQuery({
		queryKey: ["students", token],
		queryFn: () => fetchStudents(token ?? ""),
		enabled: Boolean(token),
	});

	const students = studentsQuery.data?.students ?? [];
	const selectedStudent = useMemo(
		() =>
			selectedStudentId == null
				? null
				: (students.find((student) => student.id === selectedStudentId) ??
					null),
		[selectedStudentId, students],
	);

	const createStudentMutation = useMutation({
		mutationFn: (payload: StudentMutationInput) =>
			createStudent(token ?? "", payload),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["students"] }),
			]);
			setIsFormOpen(false);
			setSelectedStudentId(null);
			setFormValues(createEmptyStudentFormValues());
			setFormError(null);
		},
	});

	const updateStudentMutation = useMutation({
		mutationFn: ({
			studentId,
			payload,
		}: {
			studentId: number;
			payload: StudentMutationInput;
		}) => updateStudent(token ?? "", studentId, payload),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["students"] }),
			]);
			setIsFormOpen(false);
			setSelectedStudentId(null);
			setFormValues(createEmptyStudentFormValues());
			setFormError(null);
		},
	});

	const studentRows = useMemo(
		() =>
			students.map((student) => {
				const attendance = student.risk_profile?.attendance ?? 0;
				const riskScore = student.risk_profile?.risk_score ?? 0;
				const riskLevel = getRiskLevel(riskScore) as StudentRiskLevel;

				return {
					...student,
					attendance,
					riskScore: Math.max(0, Math.min(3, riskScore)),
					riskLevel,
				};
			}),
		[students],
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
				.sort((first, second) => second.riskScore - first.riskScore)
				.slice(0, 4),
		[filteredStudents],
	);

	const isLoading = studentsQuery.isPending;
	const isError = studentsQuery.isError;
	const errorMessage = studentsQuery.error?.message ?? "Unable to load students.";

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

	const isSaving =
		createStudentMutation.isPending || updateStudentMutation.isPending;
	const mutationError =
		createStudentMutation.error?.message ??
		updateStudentMutation.error?.message;

	const riskBadgeVariant = (riskLevel: StudentRiskLevel) => {
		if (riskLevel === "critical" || riskLevel === "high") {
			return "destructive" as const;
		}

		if (riskLevel === "medium") {
			return "secondary" as const;
		}

		return "outline" as const;
	};

	const closeForm = () => {
		setIsFormOpen(false);
		setFormError(null);
		setSelectedStudentId(null);
		setFormValues(createEmptyStudentFormValues());
	};

	const openCreateForm = () => {
		setFormMode("create");
		setSelectedStudentId(null);
		setFormValues(createEmptyStudentFormValues());
		setFormError(null);
		setIsFormOpen(true);
	};

	const openEditForm = (student: StudentRecord) => {
		setFormMode("edit");
		setSelectedStudentId(student.id);
		setFormValues(createStudentFormValues(student));
		setFormError(null);
		setIsFormOpen(true);
	};

	const handleFormValueChange = <Key extends keyof StudentFormValues>(
		key: Key,
		value: StudentFormValues[Key],
	) => {
		setFormValues((currentValues) => ({
			...currentValues,
			[key]: value,
		}));
	};

	async function handleStudentSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFormError(null);

		try {
			const payload = buildStudentPayload(formValues);

			if (formMode === "create") {
				await createStudentMutation.mutateAsync(payload);
				return;
			}

			if (selectedStudentId == null) {
				throw new Error("Select a student before updating.");
			}

			await updateStudentMutation.mutateAsync({
				studentId: selectedStudentId,
				payload,
			});
		} catch (submissionError) {
			setFormError(
				submissionError instanceof Error
					? submissionError.message
					: "Unable to save student details.",
			);
		}
	}

	return (
		<DashboardLayout
			title="Students"
			description="Review live student records, attendance signals, and current risk calculations."
		>
			<div className="space-y-4">
				<StudentFormDialog
					open={isFormOpen}
					mode={formMode}
					values={formValues}
					isSaving={isSaving}
					errorMessage={formError ?? mutationError ?? null}
					onOpenChange={(open) => {
						if (open) {
							setIsFormOpen(true);
							return;
						}

						closeForm();
					}}
					onCancel={closeForm}
					onSubmit={handleStudentSubmit}
					onValueChange={handleFormValueChange}
				/>

				<Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
					<CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<CardTitle>Student Operations</CardTitle>
							<CardDescription>
								Create a new student record or update an existing one with the
								live API-backed form.
							</CardDescription>
						</div>
						<div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-80">
							<Button
								className="rounded-xl"
								onClick={openCreateForm}
								type="button"
							>
								<Plus className="size-4" />
								Add student
							</Button>
							<Button
								variant="outline"
								className="rounded-xl"
								type="button"
								disabled={selectedStudent == null}
								onClick={() => {
									if (selectedStudent) {
										openEditForm(selectedStudent);
									}
								}}
							>
								<PencilLine className="size-4" />
								Update selected student
							</Button>
						</div>
					</CardHeader>
					<CardContent className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
						<div className="rounded-xl border border-border/60 bg-muted/20 p-4">
							<p className="text-sm font-medium text-foreground">
								Create records
							</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Capture roster details, contact information, and the risk
								profile used throughout the dashboard.
							</p>
						</div>
						<div className="rounded-xl border border-border/60 bg-muted/20 p-4">
							<p className="text-sm font-medium text-foreground">
								Update records
							</p>
							<p className="mt-1 text-sm text-muted-foreground">
								{selectedStudent
									? `Selected: ${selectedStudent.name} (${selectedStudent.banner_id})`
									: "Select a student card below to stage an edit, or use the inline Edit button."}
							</p>
						</div>
					</CardContent>
				</Card>

				<div className="grid gap-4 xl:grid-cols-1">
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
										Prioritize students with risk score 2.00 or higher.
									</p>
								</div>
								<Badge variant="secondary">
									{
										studentRows.filter((student) => student.riskScore >= 2)
											.length
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
												attendance · risk score {student.riskScore.toFixed(2)}
											</p>
										</div>
										<Badge variant={riskBadgeVariant(student.riskLevel)}>
											{student.riskLevel} risk
										</Badge>
									</div>
								))}
							</div>
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
							<div className="flex gap-2">
								<div className="relative flex-1">
									<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										value={search}
										onChange={(event) => setSearch(event.target.value)}
										className="pl-9"
										placeholder="Search students"
									/>
								</div>
								<Button className="rounded-xl" onClick={openCreateForm}>
									<Plus className="size-4" />
									Add student
								</Button>
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
										className={
											student.id === selectedStudentId
												? "rounded-2xl border border-primary/50 bg-primary/5 p-4 shadow-sm transition-colors"
												: "rounded-2xl border border-border/60 bg-muted/20 p-4 shadow-sm transition-colors hover:bg-muted/30"
										}
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
											<Badge variant={riskBadgeVariant(student.riskLevel)}>
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
													{student.riskScore.toFixed(2)}
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
											<div className="flex items-center gap-2">
												<Button
													variant={
														student.id === selectedStudentId
															? "secondary"
															: "ghost"
													}
													size="sm"
													className="rounded-xl"
													type="button"
													onClick={() => setSelectedStudentId(student.id)}
												>
													{student.id === selectedStudentId
														? "Selected"
														: "Select"}
												</Button>
												<Button
													variant="outline"
													size="sm"
													className="rounded-xl"
													type="button"
													onClick={() => openEditForm(student)}
												>
													<PencilLine className="size-3.5" />
													Edit
												</Button>
											</div>
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
