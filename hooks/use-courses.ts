/**
 * Course Hooks
 *
 * TanStack Query hooks for course operations.
 * Provides data fetching, caching, and mutations for courses.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  STALE_TIMES,
  invalidateCourse,
  invalidateCourses,
  queryKeys,
} from "@/lib/query-keys";
import { useAppwrite } from "@/providers/appwrite";
import {
  createCourse,
  deleteCourse,
  getCourseById,
  getCourses,
  getCoursesByTeacher,
  getCourseWithStats,
  getEnrolledCourses,
  updateCourse,
} from "@/lib/services/courses";
import type { QueryOptions } from "@/lib/services/helpers";
import type {
  CourseDocument,
  CreateCourseInput,
  UpdateCourseInput,
} from "@/lib/services/types";
import { createQueryHook } from "./create-query-hook";

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all published courses
 *
 * @param options - Query options for pagination and filtering
 * @returns TanStack Query result with paginated courses
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useCourses({ limit: 10 });
 * ```
 */
export function useCourses(options?: QueryOptions) {
  return useQuery({
    queryKey: queryKeys.courses.list(options),
    queryFn: () => getCourses(options),
    staleTime: STALE_TIMES.STATIC,
  });
}

export const useCourse = createQueryHook(
  queryKeys.courses.detail,
  getCourseById,
);

export const useCourseWithStats = createQueryHook(
  queryKeys.courses.withStats,
  getCourseWithStats,
);

/**
 * Fetch courses by teacher ID
 *
 * @param teacherId - The teacher's user ID
 * @param options - Query options for pagination
 * @returns TanStack Query result with teacher's courses
 *
 * @example
 * ```tsx
 * const { data } = useCoursesByTeacher('teacher-123');
 * ```
 */
export function useCoursesByTeacher(
  teacherId: string | undefined,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.courses.byTeacher(teacherId!),
    queryFn: () => getCoursesByTeacher(teacherId!, options),
    enabled: !!teacherId,
    staleTime: STALE_TIMES.STATIC,
  });
}

/**
 * Fetch enrolled courses for a student
 *
 * @param studentId - The student's user ID
 * @param options - Query options for pagination
 * @returns TanStack Query result with student's enrolled courses
 *
 * @example
 * ```tsx
 * const { data } = useEnrolledCourses('student-123');
 * ```
 */
export function useEnrolledCourses(
  studentId: string | undefined,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.courses.enrolled(studentId!),
    queryFn: () => getEnrolledCourses(studentId!, options),
    enabled: !!studentId,
    staleTime: STALE_TIMES.STATIC,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new course
 *
 * @returns Mutation object for creating courses
 *
 * @example
 * ```tsx
 * const { mutate: create } = useCreateCourse();
 * create({ title: 'New Course', ... });
 * ```
 */
export function useCreateCourse() {
  const queryClient = useQueryClient();
  const { userProfile } = useAppwrite();

  return useMutation({
    mutationFn: (data: CreateCourseInput) =>
      createCourse(data, userProfile!.$id),
    onSuccess: (newCourse) => {
      // Invalidate course lists
      invalidateCourses(queryClient);

      // Invalidate teacher's course list
      queryClient.invalidateQueries({
        queryKey: queryKeys.courses.byTeacher(newCourse.teacherId),
      });
    },
  });
}

/**
 * Update an existing course
 *
 * @returns Mutation object for updating courses
 *
 * @example
 * ```tsx
 * const { mutate: update } = useUpdateCourse();
 * update({ courseId: 'course-123', data: { title: 'Updated Title' } });
 * ```
 */
export function useUpdateCourse() {
  const queryClient = useQueryClient();
  const { userProfile } = useAppwrite();

  return useMutation({
    mutationFn: ({
      courseId,
      data,
    }: {
      courseId: string;
      data: UpdateCourseInput;
    }) => updateCourse(courseId, data, userProfile!.$id),
    onSuccess: (updatedCourse, { courseId }) => {
      // Update the cache directly for the updated course
      queryClient.setQueryData<CourseDocument>(
        queryKeys.courses.detail(courseId),
        updatedCourse,
      );

      // Invalidate related queries
      invalidateCourse(queryClient, courseId);

      // Invalidate teacher's course list
      queryClient.invalidateQueries({
        queryKey: queryKeys.courses.byTeacher(updatedCourse.teacherId),
      });
    },
  });
}

/**
 * Delete a course
 *
 * @returns Mutation object for deleting courses
 *
 * @example
 * ```tsx
 * const { mutate: remove } = useDeleteCourse();
 * remove({ courseId: 'course-123', teacherId: 'teacher-456' });
 * ```
 */
export function useDeleteCourse() {
  const queryClient = useQueryClient();
  const { userProfile } = useAppwrite();

  return useMutation({
    mutationFn: ({ courseId }: { courseId: string; teacherId?: string }) =>
      deleteCourse(courseId, userProfile!.$id),
    onSuccess: (_, { courseId, teacherId }) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.courses.detail(courseId),
      });

      // Invalidate all course lists
      invalidateCourses(queryClient);

      // Invalidate teacher's course list if provided
      if (teacherId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.courses.byTeacher(teacherId),
        });
      }
    },
  });
}
