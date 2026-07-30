import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	CalendarDays,
	MapPin,
	PencilLine,
	Plus,
	Search,
	ShieldAlert,
	ChevronUp,
	ChevronDown,
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
import { filterStudentsByRole } from "#/lib/role-based-access";
import { useAuth } from "#/features/auth/auth-provider";
import { fetchCourses } from "#/features/courses/courses-api";
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
import { getRiskLevel, getPrimaryRiskFactor, riskStyles } from "#/features/students/student-insights";

type StudentRiskLevel = "low" | "medium" | "high" | "critical";

export const Route = createFileRoute("/students")({
	component: StudentsPage,
});

function StudentsPage() {
	const { token, user } = useAuth();
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

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(12);

	// Sorting state
	const [sortBy, setSortBy] = useState<"name" | "attendance" | "age" | "risk">("name");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

	// Filter state
	const [selectedCourse, setSelectedCourse] = useState<string>("");
	const [ageMin, setAgeMin] = useState<string>("");
	const [ageMax, setAgeMax] = useState<string>("");
	const [attendanceMin, setAttendanceMin] = useState<string>("");
	const [attendanceMax, setAttendanceMax] = useState<string>("");
	const [selectedRiskLevel, setSelectedRiskLevel] = useState<StudentRiskLevel | "all">("all");
	const [selectedLearningStyle, setSelectedLearningStyle] = useState<string>("");

	const studentsQuery = useQuery({
		queryKey: ["students", token],
		queryFn: () => fetchStudents(token ?? ""),
		enabled: Boolean(token),
	});

	const coursesQuery = useQuery({
		queryKey: ["courses", token],
		queryFn: () => fetchCourses(token ?? ""),
		enabled: Boolean(token),
	});

	const courses = coursesQuery.data?.courses ?? [];

	// Apply role-based filtering to students
	const allStudents = studentsQuery.data?.students ?? [];
	const students = useMemo(
		() => filterStudentsByRole(allStudents, courses, user),
		[allStudents, courses, user],
	);
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
					displayId: `STD-${String(student.id).padStart(4, "0")}`,
					primaryRiskFactor: getPrimaryRiskFactor(student.risk_profile),
				};
			}),
		[students],
	);

	const filteredAndSortedStudents = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		// Apply search filter
		let results = studentRows.filter((student) => {
			if (!normalizedSearch) return true;

			const haystack = [
				student.name,
				student.banner_id,
				student.course?.name,
				student.city,
				student.state,
				student.personal_email,
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();

			return haystack.includes(normalizedSearch);
		});

		// Apply course filter
		if (selectedCourse) {
			results = results.filter((student) => String(student.course?.id) === selectedCourse);
		}

		// Apply age filter
		if (ageMin || ageMax) {
			results = results.filter((student) => {
				const studentAge = student.risk_profile?.age ?? 0;
				const min = ageMin ? parseInt(ageMin) : 0;
				const max = ageMax ? parseInt(ageMax) : 999;
				return studentAge >= min && studentAge <= max;
			});
		}

		// Apply attendance filter
		if (attendanceMin || attendanceMax) {
			results = results.filter((student) => {
				const studentAttendance = student.attendance ?? 0;
				const min = attendanceMin ? parseInt(attendanceMin) : 0;
				const max = attendanceMax ? parseInt(attendanceMax) : 999;
				return studentAttendance >= min && studentAttendance <= max;
			});
		}

		// Apply risk level filter
		if (selectedRiskLevel !== "all") {
			results = results.filter((student) => student.riskLevel === selectedRiskLevel);
		}

		// Apply learning style filter
		if (selectedLearningStyle) {
			results = results.filter((student) => student.risk_profile?.learning_style === selectedLearningStyle);
		}

		// Apply sorting
		results.sort((a, b) => {
			let aVal: number | string = 0;
			let bVal: number | string = 0;

			switch (sortBy) {
				case "name":
					aVal = a.name.toLowerCase();
					bVal = b.name.toLowerCase();
					break;
				case "attendance":
					aVal = a.attendance ?? 0;
					bVal = b.attendance ?? 0;
					break;
				case "age":
					aVal = a.risk_profile?.age ?? 0;
					bVal = b.risk_profile?.age ?? 0;
					break;
				case "risk":
					aVal = a.riskScore ?? 0;
					bVal = b.riskScore ?? 0;
					break;
			}

			const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
			return sortOrder === "asc" ? comparison : -comparison;
		});

		return results;
	}, [search, studentRows, selectedCourse, ageMin, ageMax, attendanceMin, attendanceMax, selectedRiskLevel, selectedLearningStyle, sortBy, sortOrder]);

	// Pagination
	const totalPages = Math.ceil(filteredAndSortedStudents.length / pageSize);
	const paginatedStudents = useMemo(() => {
		const startIdx = (currentPage - 1) * pageSize;
		const endIdx = startIdx + pageSize;
		return filteredAndSortedStudents.slice(startIdx, endIdx);
	}, [filteredAndSortedStudents, currentPage, pageSize]);

	const filteredStudents = paginatedStudents;

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
					courses={courses}
					isCoursesLoading={coursesQuery.isPending}
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

				<Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
					<CardHeader>
						<CardTitle>Filters & Sorting</CardTitle>
						<CardDescription>Customize the view of your student list</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							<div className="space-y-2">
								<label className="text-sm font-medium">Course</label>
								<select
									value={selectedCourse}
									onChange={(e) => {
										setSelectedCourse(e.target.value);
										setCurrentPage(1);
									}}
									className="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
								>
									<option value="">All courses</option>
									{courses.map((course) => (
										<option key={course.id} value={String(course.id)}>
											{course.name}
										</option>
									))}
								</select>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">Risk Level</label>
								<select
									value={selectedRiskLevel}
									onChange={(e) => {
										setSelectedRiskLevel(e.target.value as StudentRiskLevel | "all");
										setCurrentPage(1);
									}}
									className="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
								>
									<option value="all">All risk levels</option>
									<option value="low">Low</option>
									<option value="medium">Medium</option>
									<option value="high">High</option>
									<option value="critical">Critical</option>
								</select>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">Learning Style</label>
								<select
									value={selectedLearningStyle}
									onChange={(e) => {
										setSelectedLearningStyle(e.target.value);
										setCurrentPage(1);
									}}
									className="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
								>
									<option value="">All styles</option>
									<option value="visual">Visual</option>
									<option value="auditory">Auditory</option>
									<option value="kinesthetic">Kinesthetic</option>
									<option value="reading_writing">Reading/Writing</option>
								</select>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">Sort By</label>
								<div className="flex gap-2">
									<select
										value={sortBy}
										onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
										className="flex h-9 flex-1 rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
									>
										<option value="name">Name</option>
										<option value="attendance">Attendance</option>
										<option value="age">Age</option>
										<option value="risk">Risk Score</option>
									</select>
									<Button
										size="sm"
										variant="outline"
										onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
										className="px-3"
									>
										{sortOrder === "asc" ? (
											<ChevronUp className="size-4" />
										) : (
											<ChevronDown className="size-4" />
										)}
									</Button>
								</div>
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							<div className="space-y-2">
								<label className="text-sm font-medium">Age Range</label>
								<div className="flex gap-2">
									<Input
										type="number"
										placeholder="Min"
										value={ageMin}
										onChange={(e) => {
											setAgeMin(e.target.value);
											setCurrentPage(1);
										}}
										className="h-9"
									/>
									<Input
										type="number"
										placeholder="Max"
										value={ageMax}
										onChange={(e) => {
											setAgeMax(e.target.value);
											setCurrentPage(1);
										}}
										className="h-9"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">Attendance %</label>
								<div className="flex gap-2">
									<Input
										type="number"
										placeholder="Min"
										value={attendanceMin}
										onChange={(e) => {
											setAttendanceMin(e.target.value);
											setCurrentPage(1);
										}}
										className="h-9"
									/>
									<Input
										type="number"
										placeholder="Max"
										value={attendanceMax}
										onChange={(e) => {
											setAttendanceMax(e.target.value);
											setCurrentPage(1);
										}}
										className="h-9"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">Page Size</label>
								<select
									value={pageSize}
									onChange={(e) => {
										setPageSize(parseInt(e.target.value));
										setCurrentPage(1);
									}}
									className="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
								>
									<option value={6}>6 per page</option>
									<option value={12}>12 per page</option>
									<option value={24}>24 per page</option>
									<option value={50}>50 per page</option>
								</select>
							</div>

							<div className="flex items-end">
								<Button
									variant="outline"
									onClick={() => {
										setSearch("");
										setSelectedCourse("");
										setAgeMin("");
										setAgeMax("");
										setAttendanceMin("");
										setAttendanceMax("");
										setSelectedRiskLevel("all");
										setSelectedLearningStyle("");
										setSortBy("name");
										setSortOrder("asc");
										setCurrentPage(1);
										setPageSize(12);
									}}
									className="w-full"
								>
									Reset Filters
								</Button>
							</div>
						</div>

						<div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
							Showing {filteredAndSortedStudents.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
							{Math.min(currentPage * pageSize, filteredAndSortedStudents.length)} of{" "}
							{filteredAndSortedStudents.length} students
						</div>
					</CardContent>
				</Card>

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
										<Badge variant="secondary" className={riskStyles[student.riskLevel]}>
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

										{student.riskLevel !== "low" && (
											<div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
												<p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
													Primary Risk Factor
												</p>
												<p className="mt-1 text-sm font-medium text-foreground">
													{student.primaryRiskFactor.factor}
												</p>
												<p className="mt-1 text-xs text-muted-foreground">
													{student.primaryRiskFactor.description}
												</p>
											</div>
										)}

										<div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4 text-sm text-muted-foreground">
											<div>
												<p className="font-medium text-foreground">
													{student.course?.name ?? "Unassigned"}
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

						{!isError && !isLoading && filteredAndSortedStudents.length > 0 ? (
							<div className="mt-6 flex items-center justify-between gap-4 border-t border-border/60 pt-4">
								<div className="text-sm text-muted-foreground">
									Page {currentPage} of {totalPages}
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
										disabled={currentPage === 1}
									>
										Previous
									</Button>
									{Array.from({ length: totalPages }, (_, i) => i + 1)
										.filter((page) => Math.abs(page - currentPage) <= 1 || page === 1 || page === totalPages)
										.map((page, idx, arr) => (
											<div key={page}>
												{idx > 0 && arr[idx - 1] !== page - 1 && (
													<span className="px-2 py-1">...</span>
												)}
												<Button
													variant={page === currentPage ? "default" : "outline"}
													size="sm"
													onClick={() => setCurrentPage(page)}
												>
													{page}
												</Button>
											</div>
										))}
									<Button
										variant="outline"
										size="sm"
										onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
										disabled={currentPage === totalPages}
									>
										Next
									</Button>
								</div>
							</div>
						) : null}
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
}
