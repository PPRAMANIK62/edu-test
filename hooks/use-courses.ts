/**
 * Course Hooks
 *
 * TanStack Query hooks for course operations.
 * Provides data fetching, caching, and mutations for courses.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  invalidateCourse,
  invalidateCourses,
  queryKeys,
} from "@/lib/query-keys";
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch a single course by ID
 *
 * @param courseId - The course ID
 * @returns TanStack Query result with course document
 *
 * @example
 * ```tsx
 * const { data: course, isLoading } = useCourse('course-123');
 * ```
 */
export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.courses.detail(courseId!),
    queryFn: () => getCourseById(courseId!),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a course with computed stats (enrollment count, test count, etc.)
 *
 * @param courseId - The course ID
 * @returns TanStack Query result with course and stats
 *
 * @example
 * ```tsx
 * const { data } = useCourseWithStats('course-123');
 * console.log(data?.enrollmentCount);
 * ```
 */
export function useCourseWithStats(courseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.courses.withStats(courseId!),
    queryFn: () => getCourseWithStats(courseId!),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  });
}

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
  options?: QueryOptions
) {
  return useQuery({
    queryKey: queryKeys.courses.byTeacher(teacherId!),
    queryFn: () => getCoursesByTeacher(teacherId!, options),
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000,
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
  options?: QueryOptions
) {
  return useQuery({
    queryKey: queryKeys.courses.enrolled(studentId!),
    queryFn: () => getEnrolledCourses(studentId!, options),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
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

  return useMutation({
    mutationFn: (data: CreateCourseInput) => createCourse(data),
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

  return useMutation({
    mutationFn: ({
      courseId,
      data,
    }: {
      courseId: string;
      data: UpdateCourseInput;
    }) => updateCourse(courseId, data),
    onSuccess: (updatedCourse, { courseId }) => {
      // Update the cache directly for the updated course
      queryClient.setQueryData<CourseDocument>(
        queryKeys.courses.detail(courseId),
        updatedCourse
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

  return useMutation({
    mutationFn: ({ courseId }: { courseId: string; teacherId?: string }) =>
      deleteCourse(courseId),
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
