/**
 * Test Attempt Hooks
 *
 * TanStack Query hooks for test attempt operations.
 * Provides data fetching, caching, and mutations for test attempts.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  STALE_TIMES,
  invalidateAfterAttempt,
  queryKeys,
} from "@/lib/query-keys";
import {
  completeAttempt,
  getAnswersFromAttempt,
  getAttemptById,
  getAttemptsByStudent,
  getAttemptsByTest,
  getCompletedAttemptsByTest,
  getInProgressAttempt,
  getStudentTestHistory,
  startAttempt,
  submitAnswer,
  submitAnswersBatch,
} from "@/lib/services/attempts";
import type { QueryOptions } from "@/lib/services/helpers";
import type { Answer, TestAttemptRow } from "@/lib/services/types";
import { createQueryHook } from "./create-query-hook";

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
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.attempts.byStudent(studentId!),
    queryFn: () => getAttemptsByStudent(studentId!, options),
    enabled: !!studentId,
    staleTime: STALE_TIMES.DYNAMIC,
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
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.attempts.byTest(testId!),
    queryFn: () => getAttemptsByTest(testId!, options),
    enabled: !!testId,
    staleTime: STALE_TIMES.DYNAMIC,
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
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.attempts.completedByTest(testId!),
    queryFn: () => getCompletedAttemptsByTest(testId!, options),
    enabled: !!testId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

export const useAttempt = createQueryHook(
  queryKeys.attempts.detail,
  getAttemptById,
  { staleTime: STALE_TIMES.REALTIME },
);

export const useInProgressAttempt = createQueryHook(
  queryKeys.attempts.inProgress,
  getInProgressAttempt,
  { staleTime: STALE_TIMES.REALTIME },
);

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
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.attempts.history(studentId!, testId!),
    queryFn: () => getStudentTestHistory(studentId!, testId!, options),
    enabled: !!studentId && !!testId,
    staleTime: STALE_TIMES.STATIC,
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
      queryClient.setQueryData<TestAttemptRow>(
        queryKeys.attempts.detail(newAttempt.id),
        newAttempt,
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
      queryClient.setQueryData<TestAttemptRow>(
        queryKeys.attempts.detail(attemptId),
        updatedAttempt,
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
      queryClient.setQueryData<TestAttemptRow>(
        queryKeys.attempts.detail(attemptId),
        updatedAttempt,
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
      queryClient.setQueryData<TestAttemptRow>(
        queryKeys.attempts.detail(attemptId),
        completedAttempt,
      );

      // Comprehensive invalidation after attempt completion
      invalidateAfterAttempt(queryClient, studentId, testId, attemptId);
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
