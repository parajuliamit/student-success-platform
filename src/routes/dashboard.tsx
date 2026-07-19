import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, School, Target, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { AtRiskTable } from "#/components/dashboard/at-risk-table";
import { RiskChart } from "#/components/dashboard/risk-chart";
import { StatsCard } from "#/components/dashboard/stats-card";
import { DashboardLayout } from "#/components/layout/dashboard-layout";
import { StudentFormDialog } from "#/components/students/student-form-dialog";
import { useAuth } from "#/features/auth/auth-provider";
import {
	buildStudentPayload,
	createEmptyStudentFormValues,
	createStudentFormValues,
	type StudentFormValues,
} from "#/features/students/student-form";
import {
	buildCourseSummaries,
	buildDashboardStats,
	buildLiveStudentSummaries,
	buildRiskDistribution,
} from "#/features/students/student-insights";
import {
	fetchStudents,
	type StudentMutationInput,
	updateStudent,
} from "#/features/students/students-api";

export const Route = createFileRoute("/dashboard")({
	component: DashboardPage,
});

function DashboardPage() {
	const { token } = useAuth();
	const queryClient = useQueryClient();
	const [isFormOpen, setIsFormOpen] = useState(false);
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

	const studentSummaries = useMemo(
		() =>
			buildLiveStudentSummaries(studentsQuery.data?.students ?? []),
		[studentsQuery.data?.students],
	);

	const stats = useMemo(
		() => buildDashboardStats(studentSummaries),
		[studentSummaries],
	);
	const riskDistribution = useMemo(
		() => buildRiskDistribution(studentSummaries),
		[studentSummaries],
	);
	const recentAtRiskStudents = useMemo(
		() =>
			studentSummaries
				.filter((student) => student.riskLevel !== "low")
				.slice(0, 8),
		[studentSummaries],
	);
	const courseSummaries = useMemo(
		() => buildCourseSummaries(studentSummaries).slice(0, 4),
		[studentSummaries],
	);
	const isLoading = studentsQuery.isPending;

	const selectedStudent = useMemo(
		() =>
			selectedStudentId == null
				? null
				: (studentSummaries.find((student) => student.id === selectedStudentId) ??
					null),
		[selectedStudentId, studentSummaries],
	);

	const updateStudentMutation = useMutation({
		mutationFn: ({
			studentId,
			payload,
		}: {
			studentId: number;
			payload: StudentMutationInput;
		}) => updateStudent(token ?? "", studentId, payload),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["students"] });
			closeForm();
		},
	});

	const closeForm = () => {
		setIsFormOpen(false);
		setSelectedStudentId(null);
		setFormValues(createEmptyStudentFormValues());
		setFormError(null);
	};

	const openEditForm = (studentId: number) => {
		const student = studentSummaries.find((entry) => entry.id === studentId);

		if (!student) {
			setFormError("Unable to load student details.");
			return;
		}

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

	const isSaving = updateStudentMutation.isPending;
	const mutationError = updateStudentMutation.error?.message;

	async function handleStudentSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFormError(null);

		try {
			if (selectedStudent == null) {
				throw new Error("Select a student before updating.");
			}

			const payload = buildStudentPayload(formValues);
			await updateStudentMutation.mutateAsync({
				studentId: selectedStudent.id,
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
			title="Institutional Dashboard"
			description="A live operational view for academic staff to monitor student success, intervention risk, and course performance."
		>
			<div className="space-y-8">
				<StudentFormDialog
					open={isFormOpen}
					mode="edit"
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

				<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{isLoading ? null : (
						<>
							<StatsCard {...stats[0]} icon={<Users className="size-5" />} />
							<StatsCard {...stats[1]} icon={<School className="size-5" />} />
							<StatsCard
								{...stats[2]}
								icon={<Target className="size-5" />}
							/>
							<StatsCard
								{...stats[3]}
								icon={<AlertTriangle className="size-5" />}
							/>
						</>
					)}
				</section>

				<section className="grid gap-4 xl:grid-cols-2">
					<RiskChart data={riskDistribution} />
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
										· {courseRecord.averageRiskScore.toFixed(2)} avg risk score
									</p>
								</div>
							))}
						</div>
					</div>
				</section>

				<AtRiskTable
					students={recentAtRiskStudents}
					onViewStudent={(student) => openEditForm(student.id)}
				/>
			</div>
		</DashboardLayout>
	);
}
