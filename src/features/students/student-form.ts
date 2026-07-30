import type {
	StudentMutationInput,
	StudentRecord,
} from "#/features/students/students-api";

export type StudentFormMode = "create" | "edit";

export type StudentFormValues = {
	name: string;
	bannerId: string;
	joinedYear: string;
	courseId: string;
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
	onlineCourses: string;
	discussions: boolean;
	assignments: string;
	educationTechnology: boolean;
	stressLevel: string;
};

export const learningStyleOptions: StudentFormValues["learningStyle"][] = [
	"visual",
	"auditory",
	"kinesthetic",
	"reading_writing",
];

export function createEmptyStudentFormValues(): StudentFormValues {
	return {
		name: "",
		bannerId: "",
		joinedYear: String(new Date().getFullYear()),
		courseId: "",
		dateOfBirth: "",
		personalEmail: "",
		phone: "",
		addressLine1: "",
		addressLine2: "",
		city: "",
		state: "",
		country: "",
		postalCode: "",
		studyHours: "10-15",
		attendance: "75",
		resources: "2",
		motivation: "2",
		age: "20",
		gender: "male",
		learningStyle: "visual",
		extracurricular: false,
		internet: true,
		onlineCourses: "15",
		discussions: true,
		assignments: "75",
		educationTechnology: true,
		stressLevel: "1",
	};
}

function convertStudyHoursToRange(hours: number): string {
	if (hours < 5) return "0-5";
	if (hours < 10) return "5-10";
	if (hours < 15) return "10-15";
	if (hours < 20) return "15-20";
	return "20+";
}

function convertAttendanceToRange(attendance: number): string {
	if (attendance < 25) return "0";
	if (attendance < 50) return "25";
	if (attendance < 75) return "50";
	if (attendance < 90) return "75";
	return "90";
}

function convertOnlineCoursesToRange(courses: number): string {
	if (courses < 5) return "0";
	if (courses < 10) return "5";
	if (courses < 15) return "10";
	return "15";
}

function convertAssignmentsToRange(assignments: number): string {
	if (assignments < 25) return "0";
	if (assignments < 50) return "25";
	if (assignments < 75) return "50";
	return "75";
}

export function createStudentFormValues(student: StudentRecord): StudentFormValues {
	return {
		name: student.name,
		bannerId: student.banner_id,
		joinedYear: String(student.joined_year),
		courseId: student.course ? String(student.course.id) : "",
		dateOfBirth: student.date_of_birth ?? "",
		personalEmail: student.personal_email ?? "",
		phone: student.phone ?? "",
		addressLine1: student.address_line1 ?? "",
		addressLine2: student.address_line2 ?? "",
		city: student.city ?? "",
		state: student.state ?? "",
		country: student.country ?? "",
		postalCode: student.postal_code ?? "",
		studyHours: convertStudyHoursToRange(student.risk_profile?.study_hours ?? 10),
		attendance: convertAttendanceToRange(student.risk_profile?.attendance ?? 85),
		resources: String(student.risk_profile?.resources ?? 2),
		motivation: String(student.risk_profile?.motivation ?? 2),
		age: String(student.risk_profile?.age ?? 20),
		gender: student.risk_profile?.gender ?? "male",
		learningStyle: student.risk_profile?.learning_style ?? "visual",
		extracurricular: student.risk_profile?.extracurricular ?? false,
		internet: student.risk_profile?.internet ?? true,
		onlineCourses: convertOnlineCoursesToRange(student.risk_profile?.online_courses ?? 20),
		discussions: student.risk_profile?.discussions ?? true,
		assignments: convertAssignmentsToRange(student.risk_profile?.assignments ?? 100),
		educationTechnology: student.risk_profile?.education_technology ?? true,
		stressLevel: String(student.risk_profile?.stress_level ?? 1),
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

function validateNumberRange(value: number, min: number, max: number, label: string) {
	if (value < min || value > max) {
		throw new Error(`${label} must be between ${min} and ${max}.`);
	}
	return value;
}

function parseStudyHoursRange(value: string): number {
	if (!value) throw new Error("Study hours is required.");
	const ranges: Record<string, number> = {
		"0-5": 2.5,
		"5-10": 7.5,
		"10-15": 12.5,
		"15-20": 17.5,
		"20+": 22,
	};
	return ranges[value] ?? parseRequiredNumber(value, "Study hours");
}

function parseAttendanceRange(value: string): number {
	if (!value) throw new Error("Attendance is required.");
	const ranges: Record<string, number> = {
		"0": 12.5,
		"25": 37.5,
		"50": 62.5,
		"75": 82.5,
		"90": 95,
	};
	return ranges[value] ?? parseRequiredNumber(value, "Attendance");
}

function parseOnlineCoursesRange(value: string): number {
	if (!value) throw new Error("Online courses is required.");
	const ranges: Record<string, number> = {
		"0": 2.5,
		"5": 7.5,
		"10": 12.5,
		"15": 17.5,
	};
	return ranges[value] ?? parseRequiredNumber(value, "Online courses");
}

function parseAssignmentsRange(value: string): number {
	if (!value) throw new Error("Assignment completion rate is required.");
	const ranges: Record<string, number> = {
		"0": 12.5,
		"25": 37.5,
		"50": 62.5,
		"75": 87.5,
	};
	return ranges[value] ?? parseRequiredNumber(value, "Assignments");
}

function validateAge(age: number) {
	if (age < 18) {
		throw new Error("Student age must be at least 18 years old.");
	}
	return age;
}

export function buildStudentPayload(values: StudentFormValues): StudentMutationInput {
	const name = values.name.trim();
	const bannerId = values.bannerId.trim();
	const courseId = values.courseId.trim();

	if (!name) {
		throw new Error("Student name is required.");
	}

	if (!bannerId) {
		throw new Error("Banner ID is required.");
	}

	if (!courseId) {
		throw new Error("Course is required.");
	}

	return {
		name,
		banner_id: bannerId,
		joined_year: parseRequiredNumber(values.joinedYear, "Joined year"),
		course_id: parseRequiredNumber(courseId, "Course"),
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
			study_hours: parseStudyHoursRange(values.studyHours),
			attendance: parseAttendanceRange(values.attendance),
			resources: validateNumberRange(
				parseRequiredNumber(values.resources, "Resources"),
				0,
				2,
				"Resources"
			),
			extracurricular: values.extracurricular ? 1 : 0,
			motivation: validateNumberRange(
				parseRequiredNumber(values.motivation, "Motivation"),
				0,
				2,
				"Motivation"
			),
			internet: values.internet ? 1 : 0,
			gender: values.gender,
			age: validateAge(parseRequiredNumber(values.age, "Age")),
			learning_style: values.learningStyle,
			online_courses: parseOnlineCoursesRange(values.onlineCourses),
			discussions: values.discussions ? 1 : 0,
			assignments: parseAssignmentsRange(values.assignments),
			education_technology: values.educationTechnology ? 1 : 0,
			stress_level: validateNumberRange(
				parseRequiredNumber(values.stressLevel, "Stress level"),
				0,
				2,
				"Stress level"
			),
		},
	};
}