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
	onlineCourses: boolean;
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
		studyHours: String(student.risk_profile?.study_hours ?? 10),
		attendance: String(student.risk_profile?.attendance ?? 85),
		resources: String(student.risk_profile?.resources ?? 3),
		motivation: String(student.risk_profile?.motivation ?? 3),
		age: String(student.risk_profile?.age ?? 20),
		gender: student.risk_profile?.gender ?? "male",
		learningStyle: student.risk_profile?.learning_style ?? "visual",
		extracurricular: student.risk_profile?.extracurricular ?? false,
		internet: student.risk_profile?.internet ?? true,
		onlineCourses: Boolean(student.risk_profile?.online_courses),
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