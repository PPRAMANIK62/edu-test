/**
 * Test Hooks
 *
 * TanStack Query hooks for test operations.
 * Provides data fetching, caching, and mutations for tests.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invalidateTest, invalidateTests, queryKeys } from "@/lib/query-keys";
import type { QueryOptions } from "@/lib/services/helpers";
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
  TestDocument,
  UpdateTestInput,
} from "@/lib/services/types";

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
  options?: QueryOptions
) {
  return useQuery({
    queryKey: queryKeys.tests.byCourse(courseId!),
    queryFn: () => getTestsByCourse(courseId!, options),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
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
  options?: QueryOptions
) {
  return useQuery({
    queryKey: queryKeys.tests.publishedByCourse(courseId!),
    queryFn: () => getPublishedTestsByCourse(courseId!, options),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single test by ID
 *
 * @param testId - The test ID
 * @returns TanStack Query result with test document
 *
 * @example
 * ```tsx
 * const { data: test } = useTest('test-123');
 * ```
 */
export function useTest(testId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tests.detail(testId!),
    queryFn: () => getTestById(testId!),
    enabled: !!testId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a test with its subjects
 *
 * @param testId - The test ID
 * @returns TanStack Query result with test and subjects
 *
 * @example
 * ```tsx
 * const { data } = useTestWithSubjects('test-123');
 * console.log(data?.subjects);
 * ```
 */
export function useTestWithSubjects(testId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tests.withSubjects(testId!),
    queryFn: () => getTestWithSubjects(testId!),
    enabled: !!testId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch subjects for a test
 *
 * @param testId - The test ID
 * @returns TanStack Query result with test subjects
 *
 * @example
 * ```tsx
 * const { data: subjects } = useTestSubjects('test-123');
 * ```
 */
export function useTestSubjects(testId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tests.subjects(testId!),
    queryFn: () => getSubjectsByTest(testId!),
    enabled: !!testId,
    staleTime: 5 * 60 * 1000,
  });
}

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

  return useMutation({
    mutationFn: (data: CreateTestInput) => createTest(data),
    onSuccess: (newTest) => {
      // Invalidate test lists for the course
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests.byCourse(newTest.courseId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests.publishedByCourse(newTest.courseId),
      });

      // Invalidate course stats
      queryClient.invalidateQueries({
        queryKey: queryKeys.courses.withStats(newTest.courseId),
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

  return useMutation({
    mutationFn: ({ testId, data }: { testId: string; data: UpdateTestInput }) =>
      updateTest(testId, data),
    onSuccess: (updatedTest, { testId }) => {
      // Update the cache directly
      queryClient.setQueryData<TestDocument>(
        queryKeys.tests.detail(testId),
        updatedTest
      );

      // Invalidate related queries
      invalidateTest(queryClient, testId);

      // Invalidate course test lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests.byCourse(updatedTest.courseId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests.publishedByCourse(updatedTest.courseId),
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

  return useMutation({
    mutationFn: ({ testId }: { testId: string; courseId: string }) =>
      deleteTest(testId),
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

  return useMutation({
    mutationFn: (data: {
      testId: string;
      name: string;
      questionCount: number;
      order: number;
    }) => createTestSubject(data),
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
 * Update a test subject
 *
 * @returns Mutation object for updating test subjects
 */
export function useUpdateTestSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      subjectId,
      testId,
      data,
    }: {
      subjectId: string;
      testId: string;
      data: Partial<{ name: string; questionCount: number; order: number }>;
    }) => updateTestSubject(subjectId, data),
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

  return useMutation({
    mutationFn: ({ subjectId }: { subjectId: string; testId: string }) =>
      deleteTestSubject(subjectId),
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
