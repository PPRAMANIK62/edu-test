/**
 * Enrollment Hooks
 *
 * TanStack Query hooks for enrollment operations.
 * Provides data fetching, caching, and mutations for student enrollments.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invalidateAfterEnrollment, queryKeys } from "@/lib/query-keys";
import {
  completeEnrollment,
  enrollStudent,
  getActiveEnrollmentsByStudent,
  getEnrollment,
  getEnrollmentById,
  getEnrollmentCount,
  getEnrollmentsByCourse,
  getEnrollmentsByStudent,
  getRecentEnrollments,
  isStudentEnrolled,
  updateEnrollmentProgress,
} from "@/lib/services/enrollments";
import type { QueryOptions } from "@/lib/services/helpers";
import type {
  CreateEnrollmentInput,
  EnrollmentDocument,
} from "@/lib/services/types";

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
  options?: QueryOptions
) {
  return useQuery({
    queryKey: queryKeys.enrollments.byStudent(studentId!),
    queryFn: () => getEnrollmentsByStudent(studentId!, options),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
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
  options?: QueryOptions
) {
  return useQuery({
    queryKey: queryKeys.enrollments.activeByStudent(studentId!),
    queryFn: () => getActiveEnrollmentsByStudent(studentId!, options),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
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
  options?: QueryOptions
) {
  return useQuery({
    queryKey: queryKeys.enrollments.byCourse(courseId!),
    queryFn: () => getEnrollmentsByCourse(courseId!, options),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single enrollment by ID
 *
 * @param enrollmentId - The enrollment ID
 * @returns TanStack Query result with enrollment document
 *
 * @example
 * ```tsx
 * const { data: enrollment } = useEnrollment('enrollment-123');
 * ```
 */
export function useEnrollment(enrollmentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.enrollments.detail(enrollmentId!),
    queryFn: () => getEnrollmentById(enrollmentId!),
    enabled: !!enrollmentId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Check if a student is enrolled in a course
 *
 * @param studentId - The student's user ID
 * @param courseId - The course ID
 * @returns TanStack Query result with boolean
 *
 * @example
 * ```tsx
 * const { data: isEnrolled } = useIsStudentEnrolled('student-123', 'course-456');
 * ```
 */
export function useIsStudentEnrolled(
  studentId: string | undefined,
  courseId: string | undefined
) {
  return useQuery({
    queryKey: queryKeys.enrollments.check(studentId!, courseId!),
    queryFn: () => isStudentEnrolled(studentId!, courseId!),
    enabled: !!studentId && !!courseId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get enrollment for a specific student-course pair
 *
 * @param studentId - The student's user ID
 * @param courseId - The course ID
 * @returns TanStack Query result with enrollment or null
 *
 * @example
 * ```tsx
 * const { data: enrollment } = useStudentCourseEnrollment('student-123', 'course-456');
 * ```
 */
export function useStudentCourseEnrollment(
  studentId: string | undefined,
  courseId: string | undefined
) {
  return useQuery({
    queryKey: queryKeys.enrollments.enrollment(studentId!, courseId!),
    queryFn: () => getEnrollment(studentId!, courseId!),
    enabled: !!studentId && !!courseId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch enrollment count for a course
 *
 * @param courseId - The course ID
 * @returns TanStack Query result with count
 *
 * @example
 * ```tsx
 * const { data: count } = useEnrollmentCount('course-123');
 * ```
 */
export function useEnrollmentCount(courseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.enrollments.count(courseId!),
    queryFn: () => getEnrollmentCount(courseId!),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  });
}

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
    staleTime: 2 * 60 * 1000, // Shorter cache for recent items
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
    onSuccess: (_, { studentId, courseId }) => {
      // Comprehensive invalidation for enrollment action
      invalidateAfterEnrollment(queryClient, studentId, courseId);
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
      queryClient.setQueryData<EnrollmentDocument>(
        queryKeys.enrollments.detail(enrollmentId),
        updatedEnrollment
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
