/**
 * Question Hooks
 *
 * TanStack Query hooks for question operations.
 * Provides data fetching, caching, and mutations for questions.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invalidateTestQuestions, queryKeys } from "@/lib/query-keys";
import type { QueryOptions } from "@/lib/services/helpers";
import { useAppwrite } from "@/providers/appwrite";
import {
  bulkCreateQuestions,
  createQuestion,
  deleteQuestion,
  getQuestionById,
  getQuestionsBySubject,
  getQuestionsByTest,
  reorderQuestions,
  updateQuestion,
} from "@/lib/services/questions";
import type {
  CreateQuestionInput,
  QuestionDocument,
  UpdateQuestionInput,
} from "@/lib/services/types";

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch questions for a test
 *
 * @param testId - The test ID
 * @param options - Query options for pagination
 * @returns TanStack Query result with questions
 *
 * @example
 * ```tsx
 * const { data } = useQuestionsByTest('test-123');
 * ```
 */
export function useQuestionsByTest(
  testId: string | undefined,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.questions.byTest(testId!),
    queryFn: () => getQuestionsByTest(testId!, options),
    enabled: !!testId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch questions for a specific subject within a test
 *
 * @param testId - The test ID
 * @param subjectId - The subject ID
 * @param options - Query options for pagination
 * @returns TanStack Query result with questions for the subject
 *
 * @example
 * ```tsx
 * const { data } = useQuestionsBySubject('test-123', 'subject-456');
 * ```
 */
export function useQuestionsBySubject(
  testId: string | undefined,
  subjectId: string | undefined,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.questions.bySubject(testId!, subjectId!),
    queryFn: () => getQuestionsBySubject(testId!, subjectId!, options),
    enabled: !!testId && !!subjectId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single question by ID
 *
 * @param questionId - The question ID
 * @returns TanStack Query result with question document
 *
 * @example
 * ```tsx
 * const { data: question } = useQuestion('question-123');
 * ```
 */
export function useQuestion(questionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.questions.detail(questionId!),
    queryFn: () => getQuestionById(questionId!),
    enabled: !!questionId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new question
 *
 * @returns Mutation object for creating questions
 *
 * @example
 * ```tsx
 * const { mutate: create } = useCreateQuestion();
 * create({ testId: 'test-123', text: 'What is...', ... });
 * ```
 */
export function useCreateQuestion() {
  const queryClient = useQueryClient();
  const { userProfile } = useAppwrite();

  return useMutation({
    mutationFn: (data: CreateQuestionInput) =>
      createQuestion(data, userProfile!.$id),
    onSuccess: (newQuestion) => {
      // Invalidate questions for the test
      invalidateTestQuestions(queryClient, newQuestion.testId);

      // Invalidate question count
      queryClient.invalidateQueries({
        queryKey: queryKeys.questions.count(newQuestion.testId),
      });

      // Invalidate course stats (question count)
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests.withSubjects(newQuestion.testId),
      });
    },
  });
}

/**
 * Update an existing question
 *
 * @returns Mutation object for updating questions
 *
 * @example
 * ```tsx
 * const { mutate: update } = useUpdateQuestion();
 * update({ questionId: 'q-123', testId: 'test-456', data: { text: 'Updated' } });
 * ```
 */
export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  const { userProfile } = useAppwrite();

  return useMutation({
    mutationFn: ({
      questionId,
      data,
    }: {
      questionId: string;
      testId: string;
      data: UpdateQuestionInput;
    }) => updateQuestion(questionId, data, userProfile!.$id),
    onSuccess: (updatedQuestion, { questionId, testId }) => {
      // Update the cache directly
      queryClient.setQueryData<QuestionDocument>(
        queryKeys.questions.detail(questionId),
        updatedQuestion,
      );

      // Invalidate test questions
      invalidateTestQuestions(queryClient, testId);
    },
  });
}

/**
 * Delete a question
 *
 * @returns Mutation object for deleting questions
 *
 * @example
 * ```tsx
 * const { mutate: remove } = useDeleteQuestion();
 * remove({ questionId: 'q-123', testId: 'test-456' });
 * ```
 */
export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  const { userProfile } = useAppwrite();

  return useMutation({
    mutationFn: ({ questionId }: { questionId: string; testId: string }) =>
      deleteQuestion(questionId, userProfile!.$id),
    onSuccess: (_, { questionId, testId }) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.questions.detail(questionId),
      });

      // Invalidate test questions
      invalidateTestQuestions(queryClient, testId);

      // Invalidate question count
      queryClient.invalidateQueries({
        queryKey: queryKeys.questions.count(testId),
      });
    },
  });
}

/**
 * Reorder questions in a test
 *
 * @returns Mutation object for reordering questions
 *
 * @example
 * ```tsx
 * const { mutate: reorder } = useReorderQuestions();
 * reorder({ testId: 'test-123', questionIds: ['q-1', 'q-3', 'q-2'] });
 * ```
 */
export function useReorderQuestions() {
  const queryClient = useQueryClient();
  const { userProfile } = useAppwrite();

  return useMutation({
    mutationFn: ({
      testId,
      questionIds,
    }: {
      testId: string;
      questionIds: string[];
    }) => reorderQuestions(testId, questionIds, userProfile!.$id),
    onSuccess: (_, { testId }) => {
      // Invalidate questions for the test
      invalidateTestQuestions(queryClient, testId);
    },
  });
}

/**
 * Bulk create questions for a test
 *
 * @returns Mutation object for bulk creating questions
 *
 * @example
 * ```tsx
 * const { mutate: bulkCreate } = useBulkCreateQuestions();
 * bulkCreate({ testId: 'test-123', questions: [...] });
 * ```
 */
export function useBulkCreateQuestions() {
  const queryClient = useQueryClient();
  const { userProfile } = useAppwrite();

  return useMutation({
    mutationFn: ({
      questions,
    }: {
      testId: string;
      questions: CreateQuestionInput[];
    }) => bulkCreateQuestions(questions, userProfile!.$id),
    onSuccess: (_, { testId }) => {
      // Invalidate questions for the test
      invalidateTestQuestions(queryClient, testId);

      // Invalidate question count
      queryClient.invalidateQueries({
        queryKey: queryKeys.questions.count(testId),
      });

      // Invalidate test with subjects
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests.withSubjects(testId),
      });
    },
  });
}
