import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowRight,
	CalendarDays,
	GraduationCap,
	MapPin,
	PencilLine,
	Plus,
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Skeleton } from "#/components/ui/skeleton";
import { Switch } from "#/components/ui/switch";
import { useAuth } from "#/features/auth/auth-provider";
import {
	createStudent,
	fetchRiskCalculations,
	fetchStudents,
	type StudentMutationInput,
	type StudentRecord,
	updateStudent,
} from "#/features/students/students-api";

type StudentRiskLevel = "low" | "medium" | "high";
type StudentFormMode = "create" | "edit";

type StudentFormValues = {
	name: string;
	bannerId: string;
	joinedYear: string;
	course: string;
	dateOfBirth: string;
	personalEmail: string;
	phone: string;
	addressLine1: string;
	addressLine2: string;
	city: string;
	state: string;
	country: string;
	postalCode: string;
	studyHours: string;
	attendance: string;
	resources: string;
	motivation: string;
	age: string;
	gender: "male" | "female";
	learningStyle: "visual" | "auditory" | "kinesthetic" | "reading_writing";
	extracurricular: boolean;
	internet: boolean;
	onlineCourses: boolean;
};

const learningStyleOptions: StudentFormValues["learningStyle"][] = [
	"visual",
	"auditory",
	"kinesthetic",
	"reading_writing",
];

function createEmptyStudentFormValues(): StudentFormValues {
	return {
		name: "",
		bannerId: "",
		joinedYear: String(new Date().getFullYear()),
		course: "",
		dateOfBirth: "",
		personalEmail: "",
		phone: "",
		addressLine1: "",
		addressLine2: "",
		city: "",
		state: "",
		country: "",
		postalCode: "",
		studyHours: "10",
		attendance: "85",
		resources: "3",
		motivation: "3",
		age: "20",
		gender: "male",
		learningStyle: "visual",
		extracurricular: false,
		internet: true,
		onlineCourses: false,
	};
}

function createStudentFormValues(student: StudentRecord): StudentFormValues {
	return {
		name: student.name,
		bannerId: student.banner_id,
		joinedYear: String(student.joined_year),
		course: student.course,
		dateOfBirth: student.date_of_birth ?? "",
		personalEmail: student.personal_email ?? "",
		phone: student.phone ?? "",
		addressLine1: student.address_line1 ?? "",
		addressLine2: student.address_line2 ?? "",
		city: student.city ?? "",
		state: student.state ?? "",
		country: student.country ?? "",
		postalCode: student.postal_code ?? "",
		studyHours: String(student.risk_profile?.study_hours ?? 10),
		attendance: String(student.risk_profile?.attendance ?? 85),
		resources: String(student.risk_profile?.resources ?? 3),
		motivation: String(student.risk_profile?.motivation ?? 3),
		age: String(student.risk_profile?.age ?? 20),
		gender: student.risk_profile?.gender ?? "male",
		learningStyle: student.risk_profile?.learning_style ?? "visual",
		extracurricular: student.risk_profile?.extracurricular ?? false,
		internet: student.risk_profile?.internet ?? true,
		onlineCourses: student.risk_profile?.online_courses ?? false,
	};
}

function normalizeOptionalText(value: string) {
	const normalized = value.trim();
	return normalized ? normalized : null;
}

function parseRequiredNumber(value: string, label: string) {
	const parsed = Number(value);

	if (!Number.isFinite(parsed)) {
		throw new Error(`${label} must be a valid number.`);
	}

	return parsed;
}

function buildStudentPayload(values: StudentFormValues): StudentMutationInput {
	const name = values.name.trim();
	const bannerId = values.bannerId.trim();
	const course = values.course.trim();

	if (!name) {
		throw new Error("Student name is required.");
	}

	if (!bannerId) {
		throw new Error("Banner ID is required.");
	}

	if (!course) {
		throw new Error("Course is required.");
	}

	return {
		name,
		banner_id: bannerId,
		joined_year: parseRequiredNumber(values.joinedYear, "Joined year"),
		course,
		date_of_birth: normalizeOptionalText(values.dateOfBirth),
		personal_email: normalizeOptionalText(values.personalEmail),
		phone: normalizeOptionalText(values.phone),
		address_line1: normalizeOptionalText(values.addressLine1),
		address_line2: normalizeOptionalText(values.addressLine2),
		city: normalizeOptionalText(values.city),
		state: normalizeOptionalText(values.state),
		country: normalizeOptionalText(values.country),
		postal_code: normalizeOptionalText(values.postalCode),
		risk_profile: {
			study_hours: parseRequiredNumber(values.studyHours, "Study hours"),
			attendance: parseRequiredNumber(values.attendance, "Attendance"),
			resources: parseRequiredNumber(values.resources, "Resources"),
			extracurricular: values.extracurricular,
			motivation: parseRequiredNumber(values.motivation, "Motivation"),
			internet: values.internet,
			gender: values.gender,
			age: parseRequiredNumber(values.age, "Age"),
			learning_style: values.learningStyle,
			online_courses: values.onlineCourses,
		},
	};
}

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

	const riskQuery = useQuery({
		queryKey: ["risk-calculations", token],
		queryFn: () => fetchRiskCalculations(token ?? ""),
		enabled: Boolean(token),
	});

	const students = studentsQuery.data?.students ?? [];
	const riskCalculations = riskQuery.data?.risk_calculations ?? [];
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
				queryClient.invalidateQueries({ queryKey: ["risk-calculations"] }),
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
				queryClient.invalidateQueries({ queryKey: ["risk-calculations"] }),
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
				<Dialog
					open={isFormOpen}
					onOpenChange={(open) => {
						if (open) {
							setIsFormOpen(true);
							return;
						}

						closeForm();
					}}
				>
					<DialogContent className="w-[min(96vw,80rem)] max-h-[calc(100svh-3rem)] max-w-[80rem] overflow-hidden p-0 sm:w-[min(95vw,80rem)]">
						<DialogHeader className="border-b border-border/60 px-4 py-4 sm:px-6 sm:py-5">
							<DialogTitle>
								{formMode === "create" ? "Add student" : "Update student"}
							</DialogTitle>
							<DialogDescription>
								Save student profile details and the live risk inputs used
								across the dashboard.
							</DialogDescription>
						</DialogHeader>
						<form
							className="grid max-h-[calc(100svh-8rem)] grid-rows-[minmax(0,1fr)_auto]"
							onSubmit={handleStudentSubmit}
						>
							<div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
								<div className="space-y-6">
									<section className="space-y-4">
										<div>
											<h3 className="text-sm font-semibold">Student details</h3>
											<p className="text-sm text-muted-foreground">
												Core roster fields used across student views.
											</p>
										</div>
										<div className="grid gap-4 sm:grid-cols-2">
											<FormField label="Full name" htmlFor="student-name">
												<Input
													id="student-name"
													value={formValues.name}
													onChange={(event) =>
														handleFormValueChange("name", event.target.value)
													}
													placeholder="Taylor Brooks"
													required
												/>
											</FormField>
											<FormField label="Banner ID" htmlFor="student-banner-id">
												<Input
													id="student-banner-id"
													value={formValues.bannerId}
													onChange={(event) =>
														handleFormValueChange(
															"bannerId",
															event.target.value,
														)
													}
													placeholder="B00012345"
													required
												/>
											</FormField>
											<FormField label="Course" htmlFor="student-course">
												<Input
													id="student-course"
													value={formValues.course}
													onChange={(event) =>
														handleFormValueChange("course", event.target.value)
													}
													placeholder="Computer Science"
													required
												/>
											</FormField>
											<FormField
												label="Joined year"
												htmlFor="student-joined-year"
											>
												<Input
													id="student-joined-year"
													type="number"
													value={formValues.joinedYear}
													onChange={(event) =>
														handleFormValueChange(
															"joinedYear",
															event.target.value,
														)
													}
													required
												/>
											</FormField>
											<FormField label="Birth date" htmlFor="student-dob">
												<Input
													id="student-dob"
													type="date"
													value={formValues.dateOfBirth}
													onChange={(event) =>
														handleFormValueChange(
															"dateOfBirth",
															event.target.value,
														)
													}
												/>
											</FormField>
											<FormField label="Personal email" htmlFor="student-email">
												<Input
													id="student-email"
													type="email"
													value={formValues.personalEmail}
													onChange={(event) =>
														handleFormValueChange(
															"personalEmail",
															event.target.value,
														)
													}
													placeholder="student@example.edu"
												/>
											</FormField>
											<FormField label="Phone" htmlFor="student-phone">
												<Input
													id="student-phone"
													value={formValues.phone}
													onChange={(event) =>
														handleFormValueChange("phone", event.target.value)
													}
													placeholder="(555) 010-4400"
												/>
											</FormField>
											<FormField
												label="Address line 1"
												htmlFor="student-address-line1"
											>
												<Input
													id="student-address-line1"
													value={formValues.addressLine1}
													onChange={(event) =>
														handleFormValueChange(
															"addressLine1",
															event.target.value,
														)
													}
													placeholder="123 Market Street"
												/>
											</FormField>
											<FormField
												label="Address line 2"
												htmlFor="student-address-line2"
											>
												<Input
													id="student-address-line2"
													value={formValues.addressLine2}
													onChange={(event) =>
														handleFormValueChange(
															"addressLine2",
															event.target.value,
														)
													}
													placeholder="Apartment 4B"
												/>
											</FormField>
											<FormField label="City" htmlFor="student-city">
												<Input
													id="student-city"
													value={formValues.city}
													onChange={(event) =>
														handleFormValueChange("city", event.target.value)
													}
												/>
											</FormField>
											<FormField label="State" htmlFor="student-state">
												<Input
													id="student-state"
													value={formValues.state}
													onChange={(event) =>
														handleFormValueChange("state", event.target.value)
													}
												/>
											</FormField>
											<FormField label="Country" htmlFor="student-country">
												<Input
													id="student-country"
													value={formValues.country}
													onChange={(event) =>
														handleFormValueChange("country", event.target.value)
													}
												/>
											</FormField>
											<FormField
												label="Postal code"
												htmlFor="student-postal-code"
											>
												<Input
													id="student-postal-code"
													value={formValues.postalCode}
													onChange={(event) =>
														handleFormValueChange(
															"postalCode",
															event.target.value,
														)
													}
												/>
											</FormField>
										</div>
									</section>

									<section className="space-y-4">
										<div>
											<h3 className="text-sm font-semibold">Risk profile</h3>
											<p className="text-sm text-muted-foreground">
												These values feed attendance and risk calculations in
												the UI.
											</p>
										</div>
										<div className="grid gap-4 sm:grid-cols-2">
											<FormField
												label="Study hours"
												htmlFor="student-study-hours"
											>
												<Input
													id="student-study-hours"
													type="number"
													value={formValues.studyHours}
													onChange={(event) =>
														handleFormValueChange(
															"studyHours",
															event.target.value,
														)
													}
													required
												/>
											</FormField>
											<FormField
												label="Attendance %"
												htmlFor="student-attendance"
											>
												<Input
													id="student-attendance"
													type="number"
													value={formValues.attendance}
													onChange={(event) =>
														handleFormValueChange(
															"attendance",
															event.target.value,
														)
													}
													required
												/>
											</FormField>
											<FormField
												label="Resources score"
												htmlFor="student-resources"
											>
												<Input
													id="student-resources"
													type="number"
													value={formValues.resources}
													onChange={(event) =>
														handleFormValueChange(
															"resources",
															event.target.value,
														)
													}
													required
												/>
											</FormField>
											<FormField
												label="Motivation score"
												htmlFor="student-motivation"
											>
												<Input
													id="student-motivation"
													type="number"
													value={formValues.motivation}
													onChange={(event) =>
														handleFormValueChange(
															"motivation",
															event.target.value,
														)
													}
													required
												/>
											</FormField>
											<FormField label="Age" htmlFor="student-age">
												<Input
													id="student-age"
													type="number"
													value={formValues.age}
													onChange={(event) =>
														handleFormValueChange("age", event.target.value)
													}
													required
												/>
											</FormField>
											<FormField label="Gender" htmlFor="student-gender">
												<select
													id="student-gender"
													value={formValues.gender}
													onChange={(event) =>
														handleFormValueChange(
															"gender",
															event.target.value as StudentFormValues["gender"],
														)
													}
													className="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
												>
													<option value="male">Male</option>
													<option value="female">Female</option>
												</select>
											</FormField>
											<FormField
												label="Learning style"
												htmlFor="student-learning-style"
											>
												<select
													id="student-learning-style"
													value={formValues.learningStyle}
													onChange={(event) =>
														handleFormValueChange(
															"learningStyle",
															event.target
																.value as StudentFormValues["learningStyle"],
														)
													}
													className="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
												>
													{learningStyleOptions.map((option) => (
														<option key={option} value={option}>
															{option.replace("_", " ")}
														</option>
													))}
												</select>
											</FormField>
										</div>
										<div className="grid gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 sm:grid-cols-2">
											<ToggleField
												label="Extracurricular"
												description="Student joins activities outside class."
												checked={formValues.extracurricular}
												onCheckedChange={(checked) =>
													handleFormValueChange("extracurricular", checked)
												}
											/>
											<ToggleField
												label="Internet access"
												description="Reliable access for coursework."
												checked={formValues.internet}
												onCheckedChange={(checked) =>
													handleFormValueChange("internet", checked)
												}
											/>
											<ToggleField
												label="Online courses"
												description="Currently enrolled in online modules."
												checked={formValues.onlineCourses}
												onCheckedChange={(checked) =>
													handleFormValueChange("onlineCourses", checked)
												}
											/>
										</div>
									</section>
								</div>

								{formError || mutationError ? (
									<div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
										{formError ?? mutationError}
									</div>
								) : null}
							</div>

							<DialogFooter className="border-t border-border/60 px-4 py-4 sm:px-6 sm:py-5">
								<Button type="button" variant="outline" onClick={closeForm}>
									Cancel
								</Button>
								<Button type="submit" disabled={isSaving}>
									{isSaving
										? "Saving..."
										: formMode === "create"
											? "Add student"
											: "Save changes"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>

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
					{/* <Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
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
					</Card> */}

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

function RegistrySkeleton() {
	return (
		<div className="rounded-xl border border-border/60 bg-muted/30 p-4">
			<Skeleton className="size-5 rounded-full" />
			<Skeleton className="mt-3 h-8 w-20" />
			<Skeleton className="mt-2 h-4 w-24" />
		</div>
	);
}

function FormField({
	label,
	htmlFor,
	children,
}: {
	label: string;
	htmlFor: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-2">
			<Label htmlFor={htmlFor}>{label}</Label>
			{children}
		</div>
	);
}

function ToggleField({
	label,
	description,
	checked,
	onCheckedChange,
}: {
	label: string;
	description: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
}) {
	return (
		<div className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-background/70 p-3">
			<div>
				<p className="text-sm font-medium">{label}</p>
				<p className="text-sm text-muted-foreground">{description}</p>
			</div>
			<Switch checked={checked} onCheckedChange={onCheckedChange} />
		</div>
	);
}
