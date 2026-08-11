import { API_BASE_URL } from "#/features/auth/auth-api";
import type { CourseRecord } from "#/features/courses/courses-api";

export interface StudentRiskProfile {
	id: number;
	student_id: number;
	study_hours: number;
	attendance: number;
	resources: number;
	extracurricular: boolean;
	motivation: number;
	internet: boolean;
	gender: "male" | "female";
	age: number;
	learning_style: "visual" | "auditory" | "kinesthetic" | "reading_writing";
	online_courses: number;
	discussions: boolean;
	assignments: number;
	education_technology: boolean;
	stress_level: number;
	risk_score: number;
	created_at: string;
	updated_at: string;
}

export interface StudentRecord {
	id: number;
	name: string;
	banner_id: string;
	joined_year: number;
	course: CourseRecord | null;
	date_of_birth: string | null;
	personal_email: string | null;
	phone: string | null;
	address_line1: string | null;
	address_line2: string | null;
	city: string | null;
	state: string | null;
	country: string | null;
	postal_code: string | null;
	created_at: string;
	updated_at: string;
	risk_profile: StudentRiskProfile | null;
}

export interface StudentsResponse {
	students: StudentRecord[];
}

export interface RiskCalculationRecord {
	id: number;
	risk_profile_id: number;
	risk_percentage: number;
	model_name: string | null;
	notes: string | null;
	created_at: string;
	updated_at: string;
}

export interface RiskCalculationsResponse {
	risk_calculations: RiskCalculationRecord[];
}

export interface StudentRiskProfileInput {
	study_hours: number;
	attendance: number;
	resources: number;
	extracurricular: boolean;
	motivation: number;
	internet: boolean;
	gender: "male" | "female";
	age: number;
	learning_style: "visual" | "auditory" | "kinesthetic" | "reading_writing";
	online_courses: number;
	discussions: boolean;
	assignments: number;
	education_technology: boolean;
	stress_level: number;
}

export interface StudentMutationInput {
	name: string;
	banner_id: string;
	joined_year: number;
	course_id: number;
	date_of_birth: string | null;
	personal_email: string | null;
	phone: string | null;
	address_line1: string | null;
	address_line2: string | null;
	city: string | null;
	state: string | null;
	country: string | null;
	postal_code: string | null;
}

export interface StudentMutationResponse {
	student: StudentRecord;
}

function getErrorMessage(responseBody: unknown, fallback: string) {
	if (
		responseBody &&
		typeof responseBody === "object" &&
		"detail" in responseBody &&
		typeof responseBody.detail === "string"
	) {
		return responseBody.detail;
	}

	if (
		responseBody &&
		typeof responseBody === "object" &&
		"message" in responseBody &&
		typeof responseBody.message === "string"
	) {
		return responseBody.message;
	}

	return fallback;
}

async function parseJsonResponse(response: Response) {
	const text = await response.text();

	if (!text) {
		return null;
	}

	try {
		return JSON.parse(text) as unknown;
	} catch {
		return text;
	}
}

export async function fetchStudents(accessToken: string) {
	const response = await fetch(`${API_BASE_URL}/students`, {
		method: "GET",
		headers: {
			accept: "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
	});

	const responseBody = await parseJsonResponse(response);

	if (!response.ok) {
		throw new Error(getErrorMessage(responseBody, "Unable to load students."));
	}

	return responseBody as StudentsResponse;
}

export async function fetchRiskCalculations(accessToken: string) {
	const response = await fetch(`${API_BASE_URL}/risk-calculations`, {
		method: "GET",
		headers: {
			accept: "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
	});

	const responseBody = await parseJsonResponse(response);

	if (!response.ok) {
		throw new Error(
			getErrorMessage(responseBody, "Unable to load risk calculations."),
		);
	}

	return responseBody as RiskCalculationsResponse;
}

async function sendStudentMutation(
	accessToken: string,
	url: string,
	method: "POST" | "PATCH",
	payload: StudentMutationInput,
) {
	const response = await fetch(url, {
		method,
		headers: {
			accept: "application/json",
			"content-type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
		body: JSON.stringify(payload),
	});

	const responseBody = await parseJsonResponse(response);

	if (!response.ok) {
		throw new Error(
			getErrorMessage(
				responseBody,
				method === "POST"
					? "Unable to create student."
					: "Unable to update student.",
			),
		);
	}

	return responseBody as StudentMutationResponse;
}

export async function createStudent(
	accessToken: string,
	payload: StudentMutationInput,
) {
	return sendStudentMutation(
		accessToken,
		`${API_BASE_URL}/students`,
		"POST",
		payload,
	);
}

export async function updateStudent(
	accessToken: string,
	studentId: number,
	payload: StudentMutationInput,
) {
	return sendStudentMutation(
		accessToken,
		`${API_BASE_URL}/students/${studentId}`,
		"PATCH",
		payload,
	);
}

async function sendRiskProfileMutation(
	accessToken: string,
	url: string,
	method: "POST" | "PATCH",
	payload: StudentRiskProfileInput,
) {
	const response = await fetch(url, {
		method,
		headers: {
			accept: "application/json",
			"content-type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
		body: JSON.stringify(payload),
	});

	const responseBody = await parseJsonResponse(response);

	if (!response.ok) {
		throw new Error(
			getErrorMessage(
				responseBody,
				method === "POST"
					? "Unable to create risk profile."
					: "Unable to update risk profile.",
			),
		);
	}

	return responseBody;
}

export async function createStudentRiskProfile(
	accessToken: string,
	studentId: number,
	payload: StudentRiskProfileInput,
) {
	return sendRiskProfileMutation(
		accessToken,
		`${API_BASE_URL}/students/${studentId}/risk-profile`,
		"POST",
		payload,
	);
}

export async function updateStudentRiskProfile(
	accessToken: string,
	studentId: number,
	payload: StudentRiskProfileInput,
) {
	return sendRiskProfileMutation(
		accessToken,
		`${API_BASE_URL}/students/${studentId}/risk-profile`,
		"PATCH",
		payload,
	);
}

export interface SendAtRiskEmailRequest {
	message?: string;
}

export interface SendAtRiskEmailResponse {
	success: boolean;
	message: string;
}

export interface SendBulkAtRiskEmailRequest {
	student_ids: number[];
	message?: string;
}

export interface SendBulkAtRiskEmailResponse {
	success: boolean;
	message: string;
	sent_count: number;
	failed_count: number;
	results?: Record<string, unknown>;
}

export async function sendAtRiskEmail(
	accessToken: string,
	studentId: number,
	payload?: SendAtRiskEmailRequest,
) {
	const response = await fetch(`${API_BASE_URL}/students/${studentId}/send-at-risk-email`, {
		method: "POST",
		headers: {
			accept: "application/json",
			"content-type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
		body: JSON.stringify(payload ?? {}),
	});

	const responseBody = await parseJsonResponse(response);

	if (!response.ok) {
		throw new Error(
			getErrorMessage(responseBody, "Unable to send at-risk email."),
		);
	}

	return responseBody as SendAtRiskEmailResponse;
}

export async function sendBulkAtRiskEmails(
	accessToken: string,
	payload: SendBulkAtRiskEmailRequest,
) {
	const response = await fetch(`${API_BASE_URL}/students/send-bulk-at-risk-emails`, {
		method: "POST",
		headers: {
			accept: "application/json",
			"content-type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
		body: JSON.stringify(payload),
	});

	const responseBody = await parseJsonResponse(response);

	if (!response.ok) {
		throw new Error(
			getErrorMessage(responseBody, "Unable to send at-risk emails."),
		);
	}

	return responseBody as SendBulkAtRiskEmailResponse;
}
