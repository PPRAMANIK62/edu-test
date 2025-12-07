/**
 * Test Attempt Hooks
 *
 * TanStack Query hooks for test attempt operations.
 * Provides data fetching, caching, and mutations for test attempts.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invalidateAfterAttempt, queryKeys } from "@/lib/query-keys";
import {
  completeAttempt,
  expireAttempt,
  getAnswersFromAttempt,
  getAttemptById,
  getAttemptsByStudent,
  getAttemptsByTest,
  getBestAttempt,
  getCompletedAttemptsByTest,
  getInProgressAttempt,
  getStudentTestHistory,
  getTestAttemptStats,
  startAttempt,
  submitAnswer,
  submitAnswersBatch,
} from "@/lib/services/attempts";
import type { QueryOptions } from "@/lib/services/helpers";
import type { Answer, TestAttemptDocument } from "@/lib/services/types";

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch attempts by student ID
 *
 * @param studentId - The student's user ID
 * @param options - Query options for pagination
 * @returns TanStack Query result with attempts
 *
 * @example
 * ```tsx
 * const { data } = useAttemptsByStudent('student-123');
 * ```
 */
export function useAttemptsByStudent(
  studentId: string | undefined,
  options?: QueryOptions
) {
  return useQuery({
    queryKey: queryKeys.attempts.byStudent(studentId!),
    queryFn: () => getAttemptsByStudent(studentId!, options),
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000, // Shorter cache for attempts
  });
}

/**
 * Fetch attempts by test ID
 *
 * @param testId - The test ID
 * @param options - Query options for pagination
 * @returns TanStack Query result with attempts
 *
 * @example
 * ```tsx
 * const { data } = useAttemptsByTest('test-123');
 * ```
 */
export function useAttemptsByTest(
  testId: string | undefined,
  options?: QueryOptions
) {
  return useQuery({
    queryKey: queryKeys.attempts.byTest(testId!),
    queryFn: () => getAttemptsByTest(testId!, options),
    enabled: !!testId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Fetch completed attempts by test ID (for analytics)
 *
 * @param testId - The test ID
 * @param options - Query options for pagination
 * @returns TanStack Query result with completed attempts
 *
 * @example
 * ```tsx
 * const { data } = useCompletedAttemptsByTest('test-123');
 * ```
 */
export function useCompletedAttemptsByTest(
  testId: string | undefined,
  options?: QueryOptions
) {
  return useQuery({
    queryKey: queryKeys.attempts.completedByTest(testId!),
    queryFn: () => getCompletedAttemptsByTest(testId!, options),
    enabled: !!testId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Fetch a single attempt by ID
 *
 * @param attemptId - The attempt ID
 * @returns TanStack Query result with attempt document
 *
 * @example
 * ```tsx
 * const { data: attempt } = useAttempt('attempt-123');
 * ```
 */
export function useAttempt(attemptId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.attempts.detail(attemptId!),
    queryFn: () => getAttemptById(attemptId!),
    enabled: !!attemptId,
    staleTime: 30 * 1000, // Short cache for active attempts
  });
}

/**
 * Fetch in-progress attempt for student and test
 *
 * @param studentId - The student's user ID
 * @param testId - The test ID
 * @returns TanStack Query result with in-progress attempt or null
 *
 * @example
 * ```tsx
 * const { data: inProgressAttempt } = useInProgressAttempt('student-123', 'test-456');
 * ```
 */
export function useInProgressAttempt(
  studentId: string | undefined,
  testId: string | undefined
) {
  return useQuery({
    queryKey: queryKeys.attempts.inProgress(studentId!, testId!),
    queryFn: () => getInProgressAttempt(studentId!, testId!),
    enabled: !!studentId && !!testId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch best attempt (highest score) for student and test
 *
 * @param studentId - The student's user ID
 * @param testId - The test ID
 * @returns TanStack Query result with best attempt or null
 *
 * @example
 * ```tsx
 * const { data: bestAttempt } = useBestAttempt('student-123', 'test-456');
 * ```
 */
export function useBestAttempt(
  studentId: string | undefined,
  testId: string | undefined
) {
  return useQuery({
    queryKey: queryKeys.attempts.best(studentId!, testId!),
    queryFn: () => getBestAttempt(studentId!, testId!),
    enabled: !!studentId && !!testId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch student's test history for a specific test
 *
 * @param studentId - The student's user ID
 * @param testId - The test ID
 * @param options - Query options for pagination
 * @returns TanStack Query result with attempts history
 *
 * @example
 * ```tsx
 * const { data } = useStudentTestHistory('student-123', 'test-456');
 * ```
 */
export function useStudentTestHistory(
  studentId: string | undefined,
  testId: string | undefined,
  options?: QueryOptions
) {
  return useQuery({
    queryKey: queryKeys.attempts.history(studentId!, testId!),
    queryFn: () => getStudentTestHistory(studentId!, testId!, options),
    enabled: !!studentId && !!testId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch attempt statistics for a test
 *
 * @param testId - The test ID
 * @returns TanStack Query result with test statistics
 *
 * @example
 * ```tsx
 * const { data: stats } = useTestAttemptStats('test-123');
 * ```
 */
export function useTestAttemptStats(testId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.attempts.stats(testId!),
    queryFn: () => getTestAttemptStats(testId!),
    enabled: !!testId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Start a new test attempt
 *
 * @returns Mutation object for starting attempts
 *
 * @example
 * ```tsx
 * const { mutate: start } = useStartAttempt();
 * start({ studentId: 'student-123', testId: 'test-456', courseId: 'course-789' });
 * ```
 */
export function useStartAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      testId,
      courseId,
    }: {
      studentId: string;
      testId: string;
      courseId: string;
    }) => startAttempt(studentId, testId, courseId),
    onSuccess: (newAttempt, { studentId, testId }) => {
      // Set the new attempt in cache
      queryClient.setQueryData<TestAttemptDocument>(
        queryKeys.attempts.detail(newAttempt.$id),
        newAttempt
      );

      // Invalidate in-progress query
      queryClient.invalidateQueries({
        queryKey: queryKeys.attempts.inProgress(studentId, testId),
      });

      // Invalidate student's attempts
      queryClient.invalidateQueries({
        queryKey: queryKeys.attempts.byStudent(studentId),
      });
    },
  });
}

/**
 * Submit an answer for a question
 *
 * @returns Mutation object for submitting answers
 *
 * @example
 * ```tsx
 * const { mutate: submit } = useSubmitAnswer();
 * submit({ attemptId: 'attempt-123', questionIndex: 0, selectedIndex: 1 });
 * ```
 */
export function useSubmitAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attemptId,
      questionIndex,
      selectedIndex,
      isMarkedForReview = false,
    }: {
      attemptId: string;
      questionIndex: number;
      selectedIndex: number;
      isMarkedForReview?: boolean;
    }) =>
      submitAnswer(attemptId, questionIndex, selectedIndex, isMarkedForReview),
    onSuccess: (updatedAttempt, { attemptId }) => {
      // Update the cache directly
      queryClient.setQueryData<TestAttemptDocument>(
        queryKeys.attempts.detail(attemptId),
        updatedAttempt
      );
    },
  });
}

/**
 * Submit multiple answers at once (batch update)
 *
 * @returns Mutation object for batch submitting answers
 *
 * @example
 * ```tsx
 * const { mutate: submitBatch } = useSubmitAnswersBatch();
 * submitBatch({ attemptId: 'attempt-123', answers: [[0, 1, false], [1, 2, true]] });
 * ```
 */
export function useSubmitAnswersBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attemptId,
      answers,
    }: {
      attemptId: string;
      answers: Answer[];
    }) => submitAnswersBatch(attemptId, answers),
    onSuccess: (updatedAttempt, { attemptId }) => {
      // Update the cache directly
      queryClient.setQueryData<TestAttemptDocument>(
        queryKeys.attempts.detail(attemptId),
        updatedAttempt
      );
    },
  });
}

/**
 * Complete a test attempt
 *
 * @returns Mutation object for completing attempts
 *
 * @example
 * ```tsx
 * const { mutate: complete } = useCompleteAttempt();
 * complete({ attemptId: 'attempt-123', studentId: 'student-456', testId: 'test-789' });
 * ```
 */
export function useCompleteAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attemptId,
    }: {
      attemptId: string;
      studentId: string;
      testId: string;
    }) => completeAttempt(attemptId),
    onSuccess: (completedAttempt, { attemptId, studentId, testId }) => {
      // Update the cache directly
      queryClient.setQueryData<TestAttemptDocument>(
        queryKeys.attempts.detail(attemptId),
        completedAttempt
      );

      // Comprehensive invalidation after attempt completion
      invalidateAfterAttempt(queryClient, studentId, testId, attemptId);
    },
  });
}

/**
 * Mark an attempt as expired
 *
 * @returns Mutation object for expiring attempts
 *
 * @example
 * ```tsx
 * const { mutate: expire } = useExpireAttempt();
 * expire({ attemptId: 'attempt-123', studentId: 'student-456', testId: 'test-789' });
 * ```
 */
export function useExpireAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attemptId,
    }: {
      attemptId: string;
      studentId: string;
      testId: string;
    }) => expireAttempt(attemptId),
    onSuccess: (expiredAttempt, { attemptId, studentId, testId }) => {
      // Update the cache directly
      queryClient.setQueryData<TestAttemptDocument>(
        queryKeys.attempts.detail(attemptId),
        expiredAttempt
      );

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.attempts.inProgress(studentId, testId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attempts.byStudent(studentId),
      });
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Get parsed answers from an attempt
 * This is a utility function, not a hook, but exported for convenience
 */
export { getAnswersFromAttempt };
