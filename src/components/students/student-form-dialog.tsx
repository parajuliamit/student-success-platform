import type { FormEvent, ReactNode } from "react";
import { Button } from "#/components/ui/button";
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
import { Switch } from "#/components/ui/switch";
import {
	learningStyleOptions,
	type StudentFormMode,
	type StudentFormValues,
} from "#/features/students/student-form";

interface StudentFormDialogProps {
	open: boolean;
	mode: StudentFormMode;
	values: StudentFormValues;
	isSaving: boolean;
	errorMessage: string | null;
	onOpenChange: (open: boolean) => void;
	onCancel: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	onValueChange: <Key extends keyof StudentFormValues>(
		key: Key,
		value: StudentFormValues[Key],
	) => void;
}

export function StudentFormDialog({
	open,
	mode,
	values,
	isSaving,
	errorMessage,
	onOpenChange,
	onCancel,
	onSubmit,
	onValueChange,
}: StudentFormDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-[min(96vw,90rem)] max-h-[calc(100svh-2rem)] max-w-[90rem] overflow-hidden p-0 sm:w-[min(95vw,90rem)] sm:max-w-[90rem]">
				<DialogHeader className="border-b border-border/60 px-4 py-4 sm:px-6 sm:py-5">
					<DialogTitle>
						{mode === "create" ? "Add student" : "Update student"}
					</DialogTitle>
					<DialogDescription>
						Save student profile details and the live risk inputs used across
						the dashboard.
					</DialogDescription>
				</DialogHeader>
				<form
					className="grid max-h-[calc(100svh-8rem)] grid-rows-[minmax(0,1fr)_auto]"
					onSubmit={onSubmit}
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
											value={values.name}
											onChange={(event) =>
												onValueChange("name", event.target.value)
											}
											placeholder="Taylor Brooks"
											required
										/>
									</FormField>
									<FormField label="Banner ID" htmlFor="student-banner-id">
										<Input
											id="student-banner-id"
											value={values.bannerId}
											onChange={(event) =>
												onValueChange("bannerId", event.target.value)
											}
											placeholder="B00012345"
											required
										/>
									</FormField>
									<FormField label="Course" htmlFor="student-course">
										<Input
											id="student-course"
											value={values.course}
											onChange={(event) =>
												onValueChange("course", event.target.value)
											}
											placeholder="Computer Science"
											required
										/>
									</FormField>
									<FormField label="Joined year" htmlFor="student-joined-year">
										<Input
											id="student-joined-year"
											type="number"
											value={values.joinedYear}
											onChange={(event) =>
												onValueChange("joinedYear", event.target.value)
											}
											required
										/>
									</FormField>
									<FormField label="Birth date" htmlFor="student-dob">
										<Input
											id="student-dob"
											type="date"
											value={values.dateOfBirth}
											onChange={(event) =>
												onValueChange("dateOfBirth", event.target.value)
											}
										/>
									</FormField>
									<FormField label="Personal email" htmlFor="student-email">
										<Input
											id="student-email"
											type="email"
											value={values.personalEmail}
											onChange={(event) =>
												onValueChange("personalEmail", event.target.value)
											}
											placeholder="student@example.edu"
										/>
									</FormField>
									<FormField label="Phone" htmlFor="student-phone">
										<Input
											id="student-phone"
											value={values.phone}
											onChange={(event) =>
												onValueChange("phone", event.target.value)
											}
											placeholder="(555) 010-4400"
										/>
									</FormField>
									<FormField label="Address line 1" htmlFor="student-address-line1">
										<Input
											id="student-address-line1"
											value={values.addressLine1}
											onChange={(event) =>
												onValueChange("addressLine1", event.target.value)
											}
											placeholder="123 Market Street"
										/>
									</FormField>
									<FormField label="Address line 2" htmlFor="student-address-line2">
										<Input
											id="student-address-line2"
											value={values.addressLine2}
											onChange={(event) =>
												onValueChange("addressLine2", event.target.value)
											}
											placeholder="Apartment 4B"
										/>
									</FormField>
									<FormField label="City" htmlFor="student-city">
										<Input
											id="student-city"
											value={values.city}
											onChange={(event) =>
												onValueChange("city", event.target.value)
											}
										/>
									</FormField>
									<FormField label="State" htmlFor="student-state">
										<Input
											id="student-state"
											value={values.state}
											onChange={(event) =>
												onValueChange("state", event.target.value)
											}
										/>
									</FormField>
									<FormField label="Country" htmlFor="student-country">
										<Input
											id="student-country"
											value={values.country}
											onChange={(event) =>
												onValueChange("country", event.target.value)
											}
										/>
									</FormField>
									<FormField label="Postal code" htmlFor="student-postal-code">
										<Input
											id="student-postal-code"
											value={values.postalCode}
											onChange={(event) =>
												onValueChange("postalCode", event.target.value)
											}
										/>
									</FormField>
								</div>
							</section>

							<section className="space-y-4">
								<div>
									<h3 className="text-sm font-semibold">Risk profile</h3>
									<p className="text-sm text-muted-foreground">
										These values feed attendance and risk calculations in the UI.
									</p>
								</div>
								<div className="grid gap-4 sm:grid-cols-2">
									<FormField label="Study hours" htmlFor="student-study-hours">
										<Input
											id="student-study-hours"
											type="number"
											value={values.studyHours}
											onChange={(event) =>
												onValueChange("studyHours", event.target.value)
											}
											required
										/>
									</FormField>
									<FormField label="Attendance %" htmlFor="student-attendance">
										<Input
											id="student-attendance"
											type="number"
											value={values.attendance}
											onChange={(event) =>
												onValueChange("attendance", event.target.value)
											}
											required
										/>
									</FormField>
									<FormField label="Resources score" htmlFor="student-resources">
										<Input
											id="student-resources"
											type="number"
											value={values.resources}
											onChange={(event) =>
												onValueChange("resources", event.target.value)
											}
											required
										/>
									</FormField>
									<FormField label="Motivation score" htmlFor="student-motivation">
										<Input
											id="student-motivation"
											type="number"
											value={values.motivation}
											onChange={(event) =>
												onValueChange("motivation", event.target.value)
											}
											required
										/>
									</FormField>
									<FormField label="Age" htmlFor="student-age">
										<Input
											id="student-age"
											type="number"
											value={values.age}
											onChange={(event) =>
												onValueChange("age", event.target.value)
											}
											required
										/>
									</FormField>
									<FormField label="Gender" htmlFor="student-gender">
										<select
											id="student-gender"
											value={values.gender}
											onChange={(event) =>
												onValueChange(
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
									<FormField label="Learning style" htmlFor="student-learning-style">
										<select
											id="student-learning-style"
											value={values.learningStyle}
											onChange={(event) =>
												onValueChange(
													"learningStyle",
													event.target.value as StudentFormValues["learningStyle"],
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
										checked={values.extracurricular}
										onCheckedChange={(checked) =>
											onValueChange("extracurricular", checked)
										}
									/>
									<ToggleField
										label="Internet access"
										description="Reliable access for coursework."
										checked={values.internet}
										onCheckedChange={(checked) =>
											onValueChange("internet", checked)
										}
									/>
									<ToggleField
										label="Online courses"
										description="Currently enrolled in online modules."
										checked={values.onlineCourses}
										onCheckedChange={(checked) =>
											onValueChange("onlineCourses", checked)
										}
									/>
								</div>
							</section>
						</div>

						{errorMessage ? (
							<div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
								{errorMessage}
							</div>
						) : null}
					</div>

					<DialogFooter className="sticky bottom-0 z-10 border-t border-border/60 bg-popover px-4 py-4 sm:px-6 sm:py-5">
						<Button type="button" variant="outline" onClick={onCancel}>
							Cancel
						</Button>
						<Button type="submit" disabled={isSaving}>
							{isSaving
								? "Saving..."
								: mode === "create"
									? "Add student"
									: "Save changes"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function FormField({
	label,
	htmlFor,
	children,
}: {
	label: string;
	htmlFor: string;
	children: ReactNode;
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