import type { AuthUser } from '#/features/auth/auth-api'
import type { CourseRecord } from '#/features/courses/courses-api'
import type { StudentRecord } from '#/features/students/students-api'

/**
 * Filters students based on the current user's role
 * - Admin: sees all students
 * - Staff: sees only students from their modules (where they are the module coordinator)
 */
export function filterStudentsByRole(
  students: StudentRecord[],
  courses: CourseRecord[],
  user: AuthUser | null,
): StudentRecord[] {
  if (!user) {
    return []
  }

  // Admin can see all students
  if (user.role === 'admin') {
    return students
  }

  // Staff can only see students from their modules
  if (user.role === 'staff') {
    const staffModuleIds = new Set(
      courses
        .filter((course) => course.module_coordinator_id === user.id)
        .map((course) => course.id),
    )

    return students.filter((student) => student.course?.id && staffModuleIds.has(student.course.id))
  }

  return []
}

/**
 * Filters courses based on the current user's role
 * - Admin: sees all courses
 * - Staff: sees only their courses (where they are the module coordinator)
 */
export function filterCoursesByRole(
  courses: CourseRecord[],
  user: AuthUser | null,
): CourseRecord[] {
  if (!user) {
    return []
  }

  // Admin can see all courses
  if (user.role === 'admin') {
    return courses
  }

  // Staff can only see their courses
  if (user.role === 'staff') {
    return courses.filter((course) => course.module_coordinator_id === user.id)
  }

  return []
}
