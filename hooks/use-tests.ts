/**
 * Test Hooks
 *
 * TanStack Query hooks for test operations.
 * Provides data fetching, caching, and mutations for tests.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  STALE_TIMES,
  invalidateTest,
  invalidateTests,
  queryKeys,
} from "@/lib/query-keys";
import type { QueryOptions } from "@/lib/services/helpers";
import { useAuth } from "@/providers/auth";
import {
  createTest,
  createTestSubject,
  deleteTest,
  deleteTestSubject,
  getPublishedTestsByCourse,
  getSubjectsByTest,
  getTestById,
  getTestsByCourse,
  getTestWithSubjects,
  updateTest,
  updateTestSubject,
} from "@/lib/services/tests";
import type {
  CreateTestInput,
  TestRow,
  UpdateTestInput,
} from "@/lib/services/types";
import { createQueryHook } from "./create-query-hook";

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch tests for a course
 *
 * @param courseId - The course ID
 * @param options - Query options for pagination
 * @returns TanStack Query result with tests
 *
 * @example
 * ```tsx
 * const { data } = useTestsByCourse('course-123');
 * ```
 */
export function useTestsByCourse(
  courseId: string | undefined,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.tests.byCourse(courseId!),
    queryFn: () => getTestsByCourse(courseId!, options),
    enabled: !!courseId,
    staleTime: STALE_TIMES.STATIC,
  });
}

/**
 * Fetch published tests for a course (student view)
 *
 * @param courseId - The course ID
 * @param options - Query options for pagination
 * @returns TanStack Query result with published tests only
 *
 * @example
 * ```tsx
 * const { data } = usePublishedTestsByCourse('course-123');
 * ```
 */
export function usePublishedTestsByCourse(
  courseId: string | undefined,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.tests.publishedByCourse(courseId!),
    queryFn: () => getPublishedTestsByCourse(courseId!, options),
    enabled: !!courseId,
    staleTime: STALE_TIMES.STATIC,
  });
}

export const useTest = createQueryHook(queryKeys.tests.detail, getTestById);

export const useTestWithSubjects = createQueryHook(
  queryKeys.tests.withSubjects,
  getTestWithSubjects,
);

export const useTestSubjects = createQueryHook(
  queryKeys.tests.subjects,
  getSubjectsByTest,
);

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new test
 *
 * @returns Mutation object for creating tests
 *
 * @example
 * ```tsx
 * const { mutate: create } = useCreateTest();
 * create({ courseId: 'course-123', title: 'New Test', ... });
 * ```
 */
export function useCreateTest() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();

  return useMutation({
    mutationFn: (data: CreateTestInput) => createTest(data, userProfile!.id),
    onSuccess: (newTest) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests.byCourse(newTest.course_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests.publishedByCourse(newTest.course_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.courses.withStats(newTest.course_id),
      });
    },
  });
}

/**
 * Update an existing test
 *
 * @returns Mutation object for updating tests
 *
 * @example
 * ```tsx
 * const { mutate: update } = useUpdateTest();
 * update({ testId: 'test-123', data: { title: 'Updated Title' } });
 * ```
 */
export function useUpdateTest() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();

  return useMutation({
    mutationFn: ({ testId, data }: { testId: string; data: UpdateTestInput }) =>
      updateTest(testId, data, userProfile!.id),
    onSuccess: (updatedTest, { testId }) => {
      queryClient.setQueryData<TestRow>(
        queryKeys.tests.detail(testId),
        updatedTest,
      );
      invalidateTest(queryClient, testId);
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests.byCourse(updatedTest.course_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests.publishedByCourse(updatedTest.course_id),
      });
    },
  });
}

/**
 * Delete a test
 *
 * @returns Mutation object for deleting tests
 *
 * @example
 * ```tsx
 * const { mutate: remove } = useDeleteTest();
 * remove({ testId: 'test-123', courseId: 'course-456' });
 * ```
 */
export function useDeleteTest() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();

  return useMutation({
    mutationFn: ({ testId }: { testId: string; courseId: string }) =>
      deleteTest(testId, userProfile!.id),
    onSuccess: (_, { testId, courseId }) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.tests.detail(testId),
      });

      // Invalidate test lists
      invalidateTests(queryClient);

      // Invalidate course-specific queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests.byCourse(courseId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests.publishedByCourse(courseId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.courses.withStats(courseId),
      });
    },
  });
}

// ============================================================================
// Subject Mutation Hooks
// ============================================================================

/**
 * Create a test subject
 *
 * @returns Mutation object for creating test subjects
 */
export function useCreateTestSubject() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();

  return useMutation({
    mutationFn: (data: {
      test_id: string;
      name: string;
      question_count: number;
      order: number;
    }) => createTestSubject(data, userProfile!.id),
    onSuccess: (_, { test_id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests.subjects(test_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests.withSubjects(test_id),
      });
    },
  });
}

/**
 * Update a test subject
 *
 * @returns Mutation object for updating test subjects
 */
export function useUpdateTestSubject() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();

  return useMutation({
    mutationFn: ({
      subjectId,
      testId,
      data,
    }: {
      subjectId: string;
      testId: string;
      data: Partial<{ name: string; question_count: number; order: number }>;
    }) => updateTestSubject(subjectId, data, testId, userProfile!.id),
    onSuccess: (_, { testId }) => {
      // Invalidate subject queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests.subjects(testId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests.withSubjects(testId),
      });
    },
  });
}

/**
 * Delete a test subject
 *
 * @returns Mutation object for deleting test subjects
 */
export function useDeleteTestSubject() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();

  return useMutation({
    mutationFn: ({
      subjectId,
      testId,
    }: {
      subjectId: string;
      testId: string;
    }) => deleteTestSubject(subjectId, testId, userProfile!.id),
    onSuccess: (_, { testId }) => {
      // Invalidate subject queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests.subjects(testId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests.withSubjects(testId),
      });
    },
  });
}
