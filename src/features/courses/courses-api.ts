import { API_BASE_URL } from "#/features/auth/auth-api";

export interface CourseRecord {
	id: number;
	name: string;
	module_coordinator: string;
	created_at?: string;
	updated_at?: string;
}

export interface CoursesResponse {
	courses: CourseRecord[];
}

export interface CourseMutationInput {
	name: string;
	module_coordinator: string;
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

export async function fetchCourses(accessToken: string) {
	const response = await fetch(`${API_BASE_URL}/courses`, {
		method: "GET",
		headers: {
			accept: "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
	});

	const responseBody = await parseJsonResponse(response);

	if (!response.ok) {
		throw new Error(getErrorMessage(responseBody, "Unable to load courses."));
	}

	return responseBody as CoursesResponse;
}

export async function createCourse(
	accessToken: string,
	payload: CourseMutationInput,
) {
	const response = await fetch(`${API_BASE_URL}/courses`, {
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
		throw new Error(getErrorMessage(responseBody, "Unable to create course."));
	}

	return responseBody;
}

export async function updateCourse(
	accessToken: string,
	courseId: number,
	payload: CourseMutationInput,
) {
	const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
		method: "PATCH",
		headers: {
			accept: "application/json",
			"content-type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
		body: JSON.stringify(payload),
	});

	const responseBody = await parseJsonResponse(response);

	if (!response.ok) {
		throw new Error(getErrorMessage(responseBody, "Unable to update course."));
	}

	return responseBody;
}
