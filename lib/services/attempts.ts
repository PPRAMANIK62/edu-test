/**
 * Test Attempt Service
 * Handles all test attempt-related database operations
 *
 * Answer format: [questionIndex, selectedIndex, isMarkedForReview]
 * Example: [0, 1, false] = Question 0, Option B selected, not marked for review
 */

import { ID, Query } from "appwrite";
import { APPWRITE_CONFIG, databases } from "../appwrite";
import { buildQueries, nowISO, parseJSON, type QueryOptions } from "./helpers";
import { getQuestionsByTest } from "./questions";
import { getTestById } from "./tests";
import type {
  Answer,
  PaginatedResponse,
  QuestionDocument,
  TestAttemptDocument,
} from "./types";

const { databaseId, tables } = APPWRITE_CONFIG;

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get attempts by student ID
 */
export async function getAttemptsByStudent(
  studentId: string,
  options: QueryOptions = {}
): Promise<PaginatedResponse<TestAttemptDocument>> {
  const queries = [
    Query.equal("studentId", studentId),
    Query.orderDesc("startedAt"),
    ...buildQueries(options),
  ];

  const response = await databases.listRows<TestAttemptDocument>({
    databaseId: databaseId!,
    tableId: tables.testAttempts!,
    queries,
  });

  return {
    documents: response.rows as TestAttemptDocument[],
    total: response.total,
    hasMore: response.total > (options.offset || 0) + response.rows.length,
  };
}

/**
 * Get attempts by test ID
 */
export async function getAttemptsByTest(
  testId: string,
  options: QueryOptions = {}
): Promise<PaginatedResponse<TestAttemptDocument>> {
  const queries = [
    Query.equal("testId", testId),
    Query.orderDesc("startedAt"),
    ...buildQueries(options),
  ];

  const response = await databases.listRows<TestAttemptDocument>({
    databaseId: databaseId!,
    tableId: tables.testAttempts!,
    queries,
  });

  return {
    documents: response.rows as TestAttemptDocument[],
    total: response.total,
    hasMore: response.total > (options.offset || 0) + response.rows.length,
  };
}

/**
 * Get completed attempts by test ID (for analytics)
 */
export async function getCompletedAttemptsByTest(
  testId: string,
  options: QueryOptions = {}
): Promise<PaginatedResponse<TestAttemptDocument>> {
  const queries = [
    Query.equal("testId", testId),
    Query.equal("status", "completed"),
    Query.orderDesc("completedAt"),
    ...buildQueries(options),
  ];

  const response = await databases.listRows<TestAttemptDocument>({
    databaseId: databaseId!,
    tableId: tables.testAttempts!,
    queries,
  });

  return {
    documents: response.rows as TestAttemptDocument[],
    total: response.total,
    hasMore: response.total > (options.offset || 0) + response.rows.length,
  };
}

/**
 * Get a single attempt by ID
 */
export async function getAttemptById(
  attemptId: string
): Promise<TestAttemptDocument | null> {
  try {
    const response = await databases.getRow<TestAttemptDocument>({
      databaseId: databaseId!,
      tableId: tables.testAttempts!,
      rowId: attemptId,
    });
    return response as TestAttemptDocument;
  } catch {
    return null;
  }
}

/**
 * Get parsed answers from attempt
 */
export function getAnswersFromAttempt(attempt: TestAttemptDocument): Answer[] {
  // Each element in the array is a JSON string representing an Answer tuple
  return attempt.answers.map((answerStr) =>
    parseJSON<Answer>(answerStr, [0, -1, false])
  );
}

/**
 * Get in-progress attempt for student and test
 */
export async function getInProgressAttempt(
  studentId: string,
  testId: string
): Promise<TestAttemptDocument | null> {
  const response = await databases.listRows<TestAttemptDocument>({
    databaseId: databaseId!,
    tableId: tables.testAttempts!,
    queries: [
      Query.equal("studentId", studentId),
      Query.equal("testId", testId),
      Query.equal("status", "in_progress"),
      Query.limit(1),
    ],
  });

  if (response.total === 0) {
    return null;
  }

  return response.rows[0] as TestAttemptDocument;
}

/**
 * Get best attempt (highest score) for student and test
 */
export async function getBestAttempt(
  studentId: string,
  testId: string
): Promise<TestAttemptDocument | null> {
  const response = await databases.listRows<TestAttemptDocument>({
    databaseId: databaseId!,
    tableId: tables.testAttempts!,
    queries: [
      Query.equal("studentId", studentId),
      Query.equal("testId", testId),
      Query.equal("status", "completed"),
      Query.orderDesc("percentage"),
      Query.limit(1),
    ],
  });

  if (response.total === 0) {
    return null;
  }

  return response.rows[0] as TestAttemptDocument;
}

// ============================================================================
// Mutation Functions
// ============================================================================

/**
 * Start a new test attempt
 */
export async function startAttempt(
  studentId: string,
  testId: string,
  courseId: string
): Promise<TestAttemptDocument> {
  // Check for existing in-progress attempt
  const existingAttempt = await getInProgressAttempt(studentId, testId);
  if (existingAttempt) {
    return existingAttempt; // Resume existing attempt
  }

  const now = nowISO();

  const response = await databases.createRow<TestAttemptDocument>({
    databaseId: databaseId!,
    tableId: tables.testAttempts!,
    rowId: ID.unique(),
    data: {
      studentId,
      testId,
      courseId,
      startedAt: now,
      completedAt: null,
      status: "in_progress",
      answers: [], // Empty answers array
      score: null,
      percentage: null,
      passed: null,
    },
  });

  return response as TestAttemptDocument;
}

/**
 * Submit an answer for a question
 *
 * @param attemptId - The attempt document ID
 * @param questionIndex - The 0-based index of the question
 * @param selectedIndex - The 0-based index of the selected option
 * @param isMarkedForReview - Whether the question is marked for review
 */
export async function submitAnswer(
  attemptId: string,
  questionIndex: number,
  selectedIndex: number,
  isMarkedForReview: boolean = false
): Promise<TestAttemptDocument> {
  // Get current attempt
  const attempt = await getAttemptById(attemptId);
  if (!attempt) {
    throw new Error("Attempt not found");
  }

  if (attempt.status !== "in_progress") {
    throw new Error("Cannot submit answers to a completed attempt");
  }

  // Parse existing answers
  const answers = getAnswersFromAttempt(attempt);

  // Find and update or add the answer
  const existingIndex = answers.findIndex((a) => a[0] === questionIndex);
  const newAnswer: Answer = [questionIndex, selectedIndex, isMarkedForReview];

  if (existingIndex >= 0) {
    answers[existingIndex] = newAnswer;
  } else {
    answers.push(newAnswer);
  }

  // Sort answers by question index for consistency
  answers.sort((a, b) => a[0] - b[0]);

  // Update attempt with new answers (each answer as JSON string in array)
  const response = await databases.updateRow<TestAttemptDocument>({
    databaseId: databaseId!,
    tableId: tables.testAttempts!,
    rowId: attemptId,
    data: {
      answers: answers.map((a) => JSON.stringify(a)),
    },
  });

  return response as TestAttemptDocument;
}

/**
 * Submit multiple answers at once (batch update)
 */
export async function submitAnswersBatch(
  attemptId: string,
  newAnswers: Answer[]
): Promise<TestAttemptDocument> {
  // Get current attempt
  const attempt = await getAttemptById(attemptId);
  if (!attempt) {
    throw new Error("Attempt not found");
  }

  if (attempt.status !== "in_progress") {
    throw new Error("Cannot submit answers to a completed attempt");
  }

  // Parse existing answers
  const answers = getAnswersFromAttempt(attempt);

  // Merge new answers
  for (const newAnswer of newAnswers) {
    const existingIndex = answers.findIndex((a) => a[0] === newAnswer[0]);
    if (existingIndex >= 0) {
      answers[existingIndex] = newAnswer;
    } else {
      answers.push(newAnswer);
    }
  }

  // Sort answers by question index
  answers.sort((a, b) => a[0] - b[0]);

  // Update attempt (each answer as JSON string in array)
  const response = await databases.updateRow<TestAttemptDocument>({
    databaseId: databaseId!,
    tableId: tables.testAttempts!,
    rowId: attemptId,
    data: {
      answers: answers.map((a) => JSON.stringify(a)),
    },
  });

  return response as TestAttemptDocument;
}

/**
 * Complete an attempt - calculate score and mark as completed
 */
export async function completeAttempt(
  attemptId: string
): Promise<TestAttemptDocument> {
  // Get current attempt
  const attempt = await getAttemptById(attemptId);
  if (!attempt) {
    throw new Error("Attempt not found");
  }

  if (attempt.status === "completed") {
    return attempt; // Already completed
  }

  // Get test details for passing score
  const test = await getTestById(attempt.testId);
  if (!test) {
    throw new Error("Test not found");
  }

  // Get all questions for this test
  const questionsResult = await getQuestionsByTest(attempt.testId, {
    limit: 1000,
  });
  const questions = questionsResult.documents;

  // Calculate score
  const answers = getAnswersFromAttempt(attempt);
  const { score, percentage } = calculateScore(answers, questions);

  // Determine if passed
  const passed = percentage >= test.passingScore;

  const now = nowISO();

  // Update attempt with final results
  const response = await databases.updateRow<TestAttemptDocument>({
    databaseId: databaseId!,
    tableId: tables.testAttempts!,
    rowId: attemptId,
    data: {
      completedAt: now,
      status: "completed",
      score,
      percentage,
      passed,
    },
  });

  return response as TestAttemptDocument;
}

/**
 * Mark an attempt as expired
 */
export async function expireAttempt(
  attemptId: string
): Promise<TestAttemptDocument> {
  const response = await databases.updateRow<TestAttemptDocument>({
    databaseId: databaseId!,
    tableId: tables.testAttempts!,
    rowId: attemptId,
    data: {
      status: "expired",
    },
  });

  return response as TestAttemptDocument;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate score from answers and questions
 */
function calculateScore(
  answers: Answer[],
  questions: QuestionDocument[]
): { score: number; percentage: number } {
  if (questions.length === 0) {
    return { score: 0, percentage: 0 };
  }

  let correctCount = 0;

  // Create a map of question index to correct index
  // Questions are ordered, so their array index is the question index
  for (const answer of answers) {
    const [questionIndex, selectedIndex] = answer;
    const question = questions[questionIndex];

    if (question && question.correctIndex === selectedIndex) {
      correctCount++;
    }
  }

  const percentage = Math.round((correctCount / questions.length) * 100);

  return {
    score: correctCount,
    percentage,
  };
}

// ============================================================================
// Analytics Functions
// ============================================================================

/**
 * Get attempt statistics for a test
 */
export async function getTestAttemptStats(testId: string): Promise<{
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  passRate: number;
}> {
  const completedResult = await getCompletedAttemptsByTest(testId, {
    limit: 1000,
  });
  const completedAttempts = completedResult.documents;

  // Get total attempts count
  const allResult = await getAttemptsByTest(testId, { limit: 1 });

  if (completedAttempts.length === 0) {
    return {
      totalAttempts: allResult.total,
      completedAttempts: 0,
      averageScore: 0,
      passRate: 0,
    };
  }

  const totalScore = completedAttempts.reduce(
    (sum, a) => sum + (a.percentage || 0),
    0
  );
  const passedCount = completedAttempts.filter((a) => a.passed).length;

  return {
    totalAttempts: allResult.total,
    completedAttempts: completedAttempts.length,
    averageScore: Math.round(totalScore / completedAttempts.length),
    passRate: Math.round((passedCount / completedAttempts.length) * 100),
  };
}

/**
 * Get student's test history for a specific test
 */
export async function getStudentTestHistory(
  studentId: string,
  testId: string,
  options: QueryOptions = {}
): Promise<PaginatedResponse<TestAttemptDocument>> {
  const queries = [
    Query.equal("studentId", studentId),
    Query.equal("testId", testId),
    Query.orderDesc("startedAt"),
    ...buildQueries(options),
  ];

  const response = await databases.listRows<TestAttemptDocument>(
    databaseId!,
    tables.testAttempts!,
    queries
  );

  return {
    documents: response.rows as TestAttemptDocument[],
    total: response.total,
    hasMore: response.total > (options.offset || 0) + response.rows.length,
  };
}
