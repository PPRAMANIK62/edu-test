/**
 * Enrollment Hooks
 *
 * TanStack Query hooks for enrollment operations.
 * Provides data fetching, caching, and mutations for student enrollments.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  STALE_TIMES,
  invalidateAfterEnrollment,
  queryKeys,
} from "@/lib/query-keys";
import {
  completeEnrollment,
  enrollStudent,
  getActiveEnrollmentsByStudent,
  getEnrollment,
  getEnrollmentById,
  getEnrollmentsByCourse,
  getEnrollmentsByStudent,
  getRecentEnrollments,
  isStudentEnrolled,
  updateEnrollmentProgress,
} from "@/lib/services/enrollments";
import type { QueryOptions } from "@/lib/services/helpers";
import type {
  CreateEnrollmentInput,
  EnrollmentRow,
} from "@/lib/services/types";
import { createQueryHook } from "./create-query-hook";

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch enrollments for a student
 *
 * @param studentId - The student's user ID
 * @param options - Query options for pagination
 * @returns TanStack Query result with enrollments
 *
 * @example
 * ```tsx
 * const { data } = useEnrollmentsByStudent('student-123');
 * ```
 */
export function useEnrollmentsByStudent(
  studentId: string | undefined,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.enrollments.byStudent(studentId!),
    queryFn: () => getEnrollmentsByStudent(studentId!, options),
    enabled: !!studentId,
    staleTime: STALE_TIMES.STATIC,
  });
}

/**
 * Fetch active enrollments for a student
 *
 * @param studentId - The student's user ID
 * @param options - Query options for pagination
 * @returns TanStack Query result with active enrollments only
 *
 * @example
 * ```tsx
 * const { data } = useActiveEnrollmentsByStudent('student-123');
 * ```
 */
export function useActiveEnrollmentsByStudent(
  studentId: string | undefined,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.enrollments.activeByStudent(studentId!),
    queryFn: () => getActiveEnrollmentsByStudent(studentId!, options),
    enabled: !!studentId,
    staleTime: STALE_TIMES.STATIC,
  });
}

/**
 * Fetch enrollments for a course
 *
 * @param courseId - The course ID
 * @param options - Query options for pagination
 * @returns TanStack Query result with course enrollments
 *
 * @example
 * ```tsx
 * const { data } = useEnrollmentsByCourse('course-123');
 * ```
 */
export function useEnrollmentsByCourse(
  courseId: string | undefined,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.enrollments.byCourse(courseId!),
    queryFn: () => getEnrollmentsByCourse(courseId!, options),
    enabled: !!courseId,
    staleTime: STALE_TIMES.STATIC,
  });
}

export const useEnrollment = createQueryHook(
  queryKeys.enrollments.detail,
  getEnrollmentById,
);

export const useIsStudentEnrolled = createQueryHook(
  queryKeys.enrollments.check,
  isStudentEnrolled,
);

export const useStudentCourseEnrollment = createQueryHook(
  queryKeys.enrollments.enrollment,
  getEnrollment,
);

/**
 * Fetch recent enrollments (for teacher dashboard)
 *
 * @param limit - Maximum number of enrollments to fetch
 * @returns TanStack Query result with recent enrollments
 *
 * @example
 * ```tsx
 * const { data: recentEnrollments } = useRecentEnrollments(10);
 * ```
 */
export function useRecentEnrollments(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.enrollments.recent(limit),
    queryFn: () => getRecentEnrollments(limit),
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Enroll a student in a course
 *
 * @returns Mutation object for enrolling students
 *
 * @example
 * ```tsx
 * const { mutate: enroll } = useEnrollStudent();
 * enroll({ studentId: 'student-123', courseId: 'course-456' });
 * ```
 */
export function useEnrollStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEnrollmentInput) => enrollStudent(data),
    onSuccess: (_, { student_id, course_id }) => {
      invalidateAfterEnrollment(queryClient, student_id, course_id);
    },
  });
}

/**
 * Update enrollment progress
 *
 * @returns Mutation object for updating progress
 *
 * @example
 * ```tsx
 * const { mutate: updateProgress } = useUpdateEnrollmentProgress();
 * updateProgress({ enrollmentId: 'enroll-123', progress: 50, studentId: 'student-123', courseId: 'course-456' });
 * ```
 */
export function useUpdateEnrollmentProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      enrollmentId,
      progress,
    }: {
      enrollmentId: string;
      progress: number;
      studentId: string;
      courseId: string;
    }) => updateEnrollmentProgress(enrollmentId, progress),
    onSuccess: (updatedEnrollment, { enrollmentId, studentId, courseId }) => {
      // Update the cache directly
      queryClient.setQueryData<EnrollmentRow>(
        queryKeys.enrollments.detail(enrollmentId),
        updatedEnrollment,
      );

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.enrollments.byStudent(studentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.enrollments.enrollment(studentId, courseId),
      });
    },
  });
}

/**
 * Complete an enrollment
 *
 * @returns Mutation object for completing enrollments
 *
 * @example
 * ```tsx
 * const { mutate: complete } = useCompleteEnrollment();
 * complete({ enrollmentId: 'enroll-123', studentId: 'student-123', courseId: 'course-456' });
 * ```
 */
export function useCompleteEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      enrollmentId,
    }: {
      enrollmentId: string;
      studentId: string;
      courseId: string;
    }) => completeEnrollment(enrollmentId),
    onSuccess: (_, { studentId, courseId }) => {
      // Comprehensive invalidation for enrollment completion
      invalidateAfterEnrollment(queryClient, studentId, courseId);
    },
  });
}
