import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PencilLine, Plus, School } from "lucide-react";
import { useMemo, useState } from "react";
import { DashboardLayout } from "#/components/layout/dashboard-layout";
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
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { useAuth } from "#/features/auth/auth-provider";
import {
	createCourse,
	fetchCourses,
	updateCourse,
	type CourseRecord,
} from "#/features/courses/courses-api";
import { buildLiveStudentSummaries } from "#/features/students/student-insights";
import { fetchStudents } from "#/features/students/students-api";

export const Route = createFileRoute("/courses")({
	component: CoursesPage,
});

function CoursesPage() {
	const { token } = useAuth();
	const queryClient = useQueryClient();
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingCourse, setEditingCourse] = useState<CourseRecord | null>(null);
	const [courseName, setCourseName] = useState("");
	const [moduleCoordinator, setModuleCoordinator] = useState("");
	const [formError, setFormError] = useState<string | null>(null);

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

	const studentSummaries = useMemo(
		() => buildLiveStudentSummaries(studentsQuery.data?.students ?? []),
		[studentsQuery.data?.students],
	);

	const statsByCourseId = useMemo(() => {
		const stats = new Map<
			number,
			{
				studentCount: number;
				attendanceTotal: number;
				highRiskCount: number;
			}
		>();

		for (const student of studentSummaries) {
			const courseId = student.course?.id;

			if (courseId == null) {
				continue;
			}

			const bucket = stats.get(courseId) ?? {
				studentCount: 0,
				attendanceTotal: 0,
				highRiskCount: 0,
			};

			bucket.studentCount += 1;
			bucket.attendanceTotal += student.attendance;
			bucket.highRiskCount +=
				student.riskLevel === "high" || student.riskLevel === "critical" ? 1 : 0;
			stats.set(courseId, bucket);
		}

		return stats;
	}, [studentSummaries]);

	const courses = coursesQuery.data?.courses ?? [];
	const totalStudents = studentSummaries.length;
	const activeCourses = courses.length;
	const averageCourseSize = activeCourses === 0 ? 0 : totalStudents / activeCourses;
	const highRiskCoursesCount =
		courses.filter((course) => {
			const stats = statsByCourseId.get(course.id);
			if (!stats || stats.studentCount === 0) {
				return false;
			}

			return stats.highRiskCount / stats.studentCount > 0.4;
		}).length;

	const createCourseMutation = useMutation({
		mutationFn: (payload: { name: string; module_coordinator: string }) =>
			createCourse(token ?? "", payload),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["courses"] });
			closeDialog();
		},
	});

	const updateCourseMutation = useMutation({
		mutationFn: ({
			courseId,
			payload,
		}: {
			courseId: number;
			payload: { name: string; module_coordinator: string };
		}) => updateCourse(token ?? "", courseId, payload),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["courses"] });
			closeDialog();
		},
	});

	const isSaving = createCourseMutation.isPending || updateCourseMutation.isPending;
	const mutationError =
		createCourseMutation.error?.message ?? updateCourseMutation.error?.message;

	const openCreateDialog = () => {
		setEditingCourse(null);
		setCourseName("");
		setModuleCoordinator("");
		setFormError(null);
		setIsDialogOpen(true);
	};

	const openEditDialog = (course: CourseRecord) => {
		setEditingCourse(course);
		setCourseName(course.name);
		setModuleCoordinator(course.module_coordinator ?? "");
		setFormError(null);
		setIsDialogOpen(true);
	};

	const closeDialog = () => {
		setIsDialogOpen(false);
		setEditingCourse(null);
		setCourseName("");
		setModuleCoordinator("");
		setFormError(null);
	};

	async function handleCourseSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFormError(null);

		const payload = {
			name: courseName.trim(),
			module_coordinator: moduleCoordinator.trim(),
		};

		if (!payload.name) {
			setFormError("Course name is required.");
			return;
		}

		if (!payload.module_coordinator) {
			setFormError("Module coordinator is required.");
			return;
		}

		try {
			if (editingCourse) {
				await updateCourseMutation.mutateAsync({
					courseId: editingCourse.id,
					payload,
				});
				return;
			}

			await createCourseMutation.mutateAsync(payload);
		} catch (error) {
			setFormError(
				error instanceof Error ? error.message : "Unable to save course.",
			);
		}
	}

	return (
		<DashboardLayout
			title="Courses"
			description="Track and manage courses in the system."
		>
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingCourse ? "Update course" : "Add course"}
						</DialogTitle>
					</DialogHeader>
					<form className="space-y-4" onSubmit={handleCourseSubmit}>
						<div className="space-y-2">
							<Label htmlFor="course-name">Course name</Label>
							<Input
								id="course-name"
								value={courseName}
								onChange={(event) => setCourseName(event.target.value)}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="course-module-coordinator">
								Module coordinator
							</Label>
							<Input
								id="course-module-coordinator"
								value={moduleCoordinator}
								onChange={(event) => setModuleCoordinator(event.target.value)}
								required
							/>
						</div>

						{formError || mutationError ? (
							<p className="text-sm text-destructive">{formError ?? mutationError}</p>
						) : null}

						<DialogFooter>
							<Button type="button" variant="outline" onClick={closeDialog}>
								Cancel
							</Button>
							<Button type="submit" disabled={isSaving}>
								{isSaving
									? "Saving..."
									: editingCourse
										? "Save course"
										: "Add course"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<section className="grid gap-4 md:grid-cols-3">
				<Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
					<CardHeader>
						<CardTitle>Active Courses</CardTitle>
						<CardDescription>Courses available in the system.</CardDescription>
					</CardHeader>
					<CardContent className="text-3xl font-semibold">{activeCourses}</CardContent>
				</Card>
				<Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
					<CardHeader>
						<CardTitle>Average Course Size</CardTitle>
						<CardDescription>Based on currently enrolled students.</CardDescription>
					</CardHeader>
					<CardContent className="text-3xl font-semibold">
						{Math.round(averageCourseSize)}
					</CardContent>
				</Card>
				<Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
					<CardHeader>
						<CardTitle>High Risk Courses</CardTitle>
						<CardDescription>
							Courses with more than 40% high-risk students.
						</CardDescription>
					</CardHeader>
					<CardContent className="text-3xl font-semibold">{highRiskCoursesCount}</CardContent>
				</Card>
			</section>

			<Card className="mt-4 rounded-xl border-border/70 bg-card/90 shadow-sm">
				<CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<CardTitle>Course Management</CardTitle>
						<CardDescription>
							Manage course records through the dedicated courses API.
						</CardDescription>
					</div>
					<Button type="button" onClick={openCreateDialog}>
						<Plus className="size-4" />
						Add course
					</Button>
				</CardHeader>
				<CardContent className="grid gap-3 sm:grid-cols-3">
					{courses.map((course) => {
						const stats = statsByCourseId.get(course.id);
						const studentCount = stats?.studentCount ?? 0;
						const averageAttendance =
							!stats || stats.studentCount === 0
								? 0
								: stats.attendanceTotal / stats.studentCount;
						const highRiskCount = stats?.highRiskCount ?? 0;

						return (
							<div
								key={course.id}
								className="rounded-xl border border-border/60 bg-muted/25 p-4"
							>
								<School className="size-5 text-primary" />
								<p className="mt-2 font-medium">{course.name}</p>
								<p className="mt-1 text-sm text-muted-foreground">
									Coordinator: {course.module_coordinator}
								</p>
								<p className="mt-1 text-sm text-muted-foreground">
									{studentCount} students · {averageAttendance.toFixed(1)}% attendance
								</p>
								<p className="mt-2 text-sm text-muted-foreground">
									{highRiskCount} high-risk student{highRiskCount === 1 ? "" : "s"}
								</p>
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="mt-3"
									onClick={() => openEditDialog(course)}
								>
									<PencilLine className="size-3.5" />
									Edit
								</Button>
							</div>
						);
					})}
				</CardContent>
			</Card>
		</DashboardLayout>
	);
}
