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
	Mail,
	Loader,
	AlertCircle,
	CheckCircle,
	Clock,
	Eye,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { filterStudentsByRole } from "#/lib/role-based-access";
import { useAuth } from "#/features/auth/auth-provider";
import { fetchCourses } from "#/features/courses/courses-api";
import {
	createStudent,
	createStudentRiskProfile,
	fetchStudents,
	type StudentMutationInput,
	type StudentRecord,
	updateStudent,
	updateStudentRiskProfile,
	sendAtRiskEmail,
	sendBulkAtRiskEmails,
} from "#/features/students/students-api";
import {
	buildStudentPayload,
	buildStudentRiskProfilePayload,
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

	const [formValues, setFormValues] = useState<StudentFormValues>(
		createEmptyStudentFormValues(),
	);
	const [formError, setFormError] = useState<string | null>(null);
	const [isViewMode, setIsViewMode] = useState(false);
	const [viewingStudent, setViewingStudent] = useState<StudentRecord | null>(null);

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

	// Email notification state
	const [emailNotification, setEmailNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);
	const [sendingEmailStudentId, setSendingEmailStudentId] = useState<
		number | null
	>(null);
	const [lastBulkEmailTime, setLastBulkEmailTime] = useState<number | null>(
		() => {
			if (typeof window === "undefined") return null;
			const stored = localStorage.getItem("lastBulkEmailTime");
			return stored ? parseInt(stored, 10) : null;
		},
	);
	const [timeUntilNextBulkEmail, setTimeUntilNextBulkEmail] = useState<number>(0);
	const [showBulkEmailConfirmation, setShowBulkEmailConfirmation] = useState<boolean>(false);
	const [criticalStudentCountForConfirm, setCriticalStudentCountForConfirm] = useState<number>(0);
	const [showIndividualEmailConfirmation, setShowIndividualEmailConfirmation] = useState<boolean>(false);
	const [confirmingStudentId, setConfirmingStudentId] = useState<number | null>(null);
	const [confirmingStudentName, setConfirmingStudentName] = useState<string>("");
	const [emailSendSuccess, setEmailSendSuccess] = useState<boolean>(false);
	const [emailSendError, setEmailSendError] = useState<string | null>(null);

	// Timer for bulk email cooldown
	useEffect(() => {
		if (!lastBulkEmailTime) {
			setTimeUntilNextBulkEmail(0);
			return;
		}

		const updateTimer = () => {
			const now = Date.now();
			const oneDay = 24 * 60 * 60 * 1000; // 1 day in milliseconds
			const timeSinceLastEmail = now - lastBulkEmailTime;
			const timeRemaining = Math.max(0, oneDay - timeSinceLastEmail);

			setTimeUntilNextBulkEmail(timeRemaining);

			if (timeRemaining === 0) {
				setLastBulkEmailTime(null);
				localStorage.removeItem("lastBulkEmailTime");
			}
		};

		updateTimer();
		const interval = setInterval(updateTimer, 1000);

		return () => clearInterval(interval);
	}, [lastBulkEmailTime]);

	const formatTimeRemaining = (ms: number) => {
		const totalSeconds = Math.floor(ms / 1000);
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		if (minutes > 0) {
			return `${minutes}m ${seconds}s`;
		}
		return `${seconds}s`;
	};

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


	const refreshStudents = async () => {
		await queryClient.invalidateQueries({ queryKey: ["students"] });
		await queryClient.refetchQueries({ queryKey: ["students"], type: "active" });
	};

	const createStudentMutation = useMutation({
		mutationFn: (payload: StudentMutationInput) =>
			createStudent(token ?? "", payload),
	});

	const updateStudentMutation = useMutation({
		mutationFn: ({
			studentId,
			payload,
		}: {
			studentId: number;
			payload: StudentMutationInput;
		}) => updateStudent(token ?? "", studentId, payload),
	});

	const sendEmailMutation = useMutation({
		mutationFn: (studentId: number) =>
			sendAtRiskEmail(token ?? "", studentId),
		onSuccess: () => {
			setSendingEmailStudentId(null);
			setEmailSendSuccess(true);
			setEmailSendError(null);
		},
		onError: (error: Error) => {
			setSendingEmailStudentId(null);
			setEmailSendError(error.message || "Failed to send email");
			setEmailSendSuccess(false);
		},
	});

	const sendBulkEmailMutation = useMutation({
		mutationFn: (studentIds: number[]) =>
			sendBulkAtRiskEmails(token ?? "", { student_ids: studentIds }),
		onSuccess: (data) => {
			const now = Date.now();
			setLastBulkEmailTime(now);
			localStorage.setItem("lastBulkEmailTime", String(now));
			setEmailNotification({
				type: "success",
				message: `Sent emails to ${data.sent_count} student(s)`,
			});
			setTimeout(() => setEmailNotification(null), 3000);
		},
		onError: (error: Error) => {
			setEmailNotification({
				type: "error",
				message: error.message || "Failed to send bulk emails",
			});
			setTimeout(() => setEmailNotification(null), 5000);
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
		setFormValues(createEmptyStudentFormValues());
		setViewingStudent(null);
		setIsViewMode(false);
	};

	const openCreateForm = () => {
		setFormMode("create");
		setFormValues(createEmptyStudentFormValues());
		setFormError(null);
		setViewingStudent(null);
		setIsViewMode(false);
		setIsFormOpen(true);
	};

	const openEditForm = (student: StudentRecord) => {
		setFormMode("edit");
		setViewingStudent(student);
		setFormValues(createStudentFormValues(student));
		setFormError(null);
		setIsViewMode(false);
		setIsFormOpen(true);
	};

	const openViewStudent = (student: StudentRecord) => {
		setViewingStudent(student);
		setFormValues(createStudentFormValues(student));
		setFormError(null);
		setFormMode("edit");
		setIsViewMode(true);
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

		if (isViewMode) {
			closeForm();
			return;
		}

		try {
			const payload = buildStudentPayload(formValues);
			const riskProfilePayload = buildStudentRiskProfilePayload(formValues);

			if (formMode === "create") {
				const createdStudent = await createStudentMutation.mutateAsync(payload);
				await createStudentRiskProfile(
					token ?? "",
					createdStudent.student.id,
					riskProfilePayload,
				);
				await refreshStudents();
				setIsFormOpen(false);
				setFormValues(createEmptyStudentFormValues());
				setViewingStudent(null);
				setFormError(null);
				return;
			}

			if (formMode !== "edit") {
				throw new Error("Select a student before updating.");
			}

			if (viewingStudent == null) {
				throw new Error("No student selected for editing.");
			}

			await updateStudentMutation.mutateAsync({
				studentId: viewingStudent.id,
				payload,
			});
			if (viewingStudent.risk_profile) {
				await updateStudentRiskProfile(token ?? "", viewingStudent.id, riskProfilePayload);
			} else {
				await createStudentRiskProfile(token ?? "", viewingStudent.id, riskProfilePayload);
			}
			await refreshStudents();
			setIsFormOpen(false);
			setFormValues(createEmptyStudentFormValues());
			setViewingStudent(null);
			setFormError(null);
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
				{emailNotification && (
					<div
						className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
							emailNotification.type === "success"
								? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
								: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300"
						}`}
					>
						{emailNotification.type === "success" ? (
							<CheckCircle className="size-5 shrink-0" />
						) : (
							<AlertCircle className="size-5 shrink-0" />
						)}
						<span className="text-sm font-medium">{emailNotification.message}</span>
					</div>
				)}

				<StudentFormDialog
					open={isFormOpen}
					mode={formMode}
					values={formValues}
					courses={courses}
					isCoursesLoading={coursesQuery.isPending}
					isSaving={isSaving}
					isViewMode={isViewMode}
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

				<Dialog open={showBulkEmailConfirmation} onOpenChange={setShowBulkEmailConfirmation}>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>Send emails to critically at-risk students?</DialogTitle>
							<DialogDescription>
								This will send at-risk notification emails to {criticalStudentCountForConfirm} student{criticalStudentCountForConfirm !== 1 ? "s" : ""}.
								<br />
								<br />
								Note: You can only send these emails once per day.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter className="pt-4">
							<Button
								variant="outline"
								onClick={() => setShowBulkEmailConfirmation(false)}
								type="button"
							>
								Cancel
							</Button>
							<Button
								onClick={() => {
									const criticalStudents = filteredAndSortedStudents.filter(
										(s) => s.riskLevel === "critical",
									);
									sendBulkEmailMutation.mutate(
										criticalStudents.map((s) => s.id),
									);
									setShowBulkEmailConfirmation(false);
								}}
								type="button"
								disabled={sendBulkEmailMutation.isPending}
							>
								{sendBulkEmailMutation.isPending ? (
									<>
										<Loader className="size-4 animate-spin" />
										Sending...
									</>
								) : (
									<>
										<Mail className="size-4" />
										Send Emails
									</>
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				<Dialog open={showIndividualEmailConfirmation} onOpenChange={(open) => {
					if (!open) {
						setShowIndividualEmailConfirmation(false);
						setEmailSendSuccess(false);
						setEmailSendError(null);
					}
				}}>
					<DialogContent className="sm:max-w-[425px]">
						{emailSendSuccess ? (
							<>
								<DialogHeader>
									<DialogTitle className="flex items-center gap-2">
										<CheckCircle className="size-5 text-emerald-600" />
										Email sent successfully
									</DialogTitle>
								</DialogHeader>
								<div className="space-y-4 py-4">
									<p className="text-sm text-muted-foreground">
										The at-risk notification email has been sent to {confirmingStudentName}.
									</p>
								</div>
								<DialogFooter>
									<Button
										onClick={() => {
											setShowIndividualEmailConfirmation(false);
											setEmailSendSuccess(false);
											setEmailSendError(null);
										}}
										type="button"
									>
										Close
									</Button>
								</DialogFooter>
							</>
						) : emailSendError ? (
							<>
								<DialogHeader>
									<DialogTitle className="flex items-center gap-2">
										<AlertCircle className="size-5 text-rose-600" />
										Failed to send email
									</DialogTitle>
								</DialogHeader>
								<div className="space-y-4 py-4">
									<div className="rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-800 dark:bg-rose-950">
										<p className="text-sm text-rose-800 dark:text-rose-300">
											{emailSendError}
										</p>
									</div>
								</div>
								<DialogFooter className="gap-2">
									<Button
										variant="outline"
										onClick={() => {
											setEmailSendError(null);
											setShowIndividualEmailConfirmation(false);
										}}
										type="button"
									>
										Cancel
									</Button>
									<Button
										onClick={() => {
											if (confirmingStudentId !== null) {
												setEmailSendError(null);
												sendEmailMutation.mutate(confirmingStudentId);
											}
										}}
										type="button"
										disabled={sendEmailMutation.isPending}
									>
										{sendEmailMutation.isPending ? (
											<>
												<Loader className="size-4 animate-spin" />
												Retrying...
											</>
										) : (
											<>
												<Mail className="size-4" />
												Try Again
											</>
										)}
									</Button>
								</DialogFooter>
							</>
						) : (
							<>
								<DialogHeader>
									<DialogTitle>Send at-risk email to {confirmingStudentName}?</DialogTitle>
									<DialogDescription>
										{sendEmailMutation.isPending
											? "Sending email..."
											: "This will send an at-risk notification email to this student."}
									</DialogDescription>
								</DialogHeader>
								{sendEmailMutation.isPending && (
									<div className="space-y-3 py-4">
										<div className="flex items-center justify-center gap-2">
											<Loader className="size-5 animate-spin text-primary" />
											<span className="text-sm font-medium">Sending email...</span>
										</div>
									</div>
								)}
								<DialogFooter className="pt-4">
									<Button
										variant="outline"
										onClick={() => setShowIndividualEmailConfirmation(false)}
										type="button"
										disabled={sendEmailMutation.isPending}
									>
										Cancel
									</Button>
									<Button
										onClick={() => {
											if (confirmingStudentId !== null) {
												sendEmailMutation.mutate(confirmingStudentId);
											}
										}}
										type="button"
										disabled={sendEmailMutation.isPending}
									>
										{sendEmailMutation.isPending ? (
											<>
												<Loader className="size-4 animate-spin" />
												Sending...
											</>
										) : (
											<>
												<Mail className="size-4" />
												Send Email
											</>
										)}
									</Button>
								</DialogFooter>
							</>
						)}
					</DialogContent>
				</Dialog>

				<Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
					<CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<CardTitle>Manage students</CardTitle>
							<CardDescription>
								Create new student records, edit details, or send emails to at-risk students.
							</CardDescription>
						</div>
						<div className="flex w-full flex-row items-center gap-2 sm:w-auto">
							<Button
								className="rounded-xl flex flex-row items-center gap-2 px-3 py-2 text-sm"
								onClick={openCreateForm}
								type="button"
							>
								<Plus className="size-4" />
								Add student
							</Button>
							<Button
								variant="outline"
								className="rounded-xl flex flex-row items-center gap-2 px-3 py-2 text-sm"
								type="button"
								disabled={
									filteredAndSortedStudents.filter(
										(s) => s.riskLevel === "critical",
									).length === 0 || sendBulkEmailMutation.isPending || timeUntilNextBulkEmail > 0
								}
								title={
									timeUntilNextBulkEmail > 0
										? `Available again in ${formatTimeRemaining(timeUntilNextBulkEmail)}`
										: undefined
								}
								onClick={() => {
									const criticalStudents = filteredAndSortedStudents.filter(
										(s) => s.riskLevel === "critical",
									);
									setCriticalStudentCountForConfirm(criticalStudents.length);
									setShowBulkEmailConfirmation(true);
								}}
							>
								{sendBulkEmailMutation.isPending ? (
									<Loader className="size-4 animate-spin" />
								) : timeUntilNextBulkEmail > 0 ? (
									<>
										<Clock className="size-4" />
										{formatTimeRemaining(timeUntilNextBulkEmail)}
									</>
								) : (
									<>
										<Mail className="size-4" />
										Send email to all critically at-risk
									</>
								)}
							</Button>
						</div>
					</CardHeader>
					
				</Card>

				<Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
					<CardHeader>
						<CardTitle>Filters & Sorting</CardTitle>
						<CardDescription>Customize the view of your student list</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

							{/* <div className="space-y-2">
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
							</div> */}

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

						{/* <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"> */}
							{/* <div className="space-y-2">
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
							</div> */}

							{/* <div className="space-y-2">
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
							</div> */}

							
						{/* </div> */}

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
												{(student.riskLevel === "high" || student.riskLevel === "critical") && (
													<Button
														variant="outline"
														size="sm"
														className="rounded-xl"
														type="button"
														disabled={sendingEmailStudentId === student.id}
														onClick={() => {
															setConfirmingStudentId(student.id);
															setConfirmingStudentName(student.name);
															setEmailSendSuccess(false);
															setEmailSendError(null);
															setShowIndividualEmailConfirmation(true);
														}}
													>
														{sendingEmailStudentId === student.id ? (
															<Loader className="size-3.5 animate-spin" />
														) : (
															<Mail className="size-3.5" />
														)}
														Email
													</Button>
												)}
												<Button
													variant="outline"
													size="sm"
													className="rounded-xl"
													type="button"
													onClick={() => openViewStudent(student)}
												>
													<Eye className="size-3.5" />
													View
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
