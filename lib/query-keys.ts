/**
 * Centralized Query Key Definitions
 *
 * This module provides a centralized place for all TanStack Query keys
 * ensuring consistent cache management and invalidation across the app.
 *
 * Key Structure Convention:
 * - Base key: ['entity'] - for listing all of an entity type
 * - List key: ['entity', 'list', filters] - for filtered lists
 * - Detail key: ['entity', 'detail', id] - for single item
 * - Related key: ['entity', 'by-parent', parentId] - for related items
 */

import type { QueryClient } from "@tanstack/react-query";
import type { QueryOptions } from "./services/helpers";

// ============================================================================
// Query Key Factory
// ============================================================================

export const queryKeys = {
  // -------------------------------------------------------------------------
  // Courses
  // -------------------------------------------------------------------------
  courses: {
    all: ["courses"] as const,
    lists: () => [...queryKeys.courses.all, "list"] as const,
    list: (filters?: QueryOptions) =>
      [...queryKeys.courses.lists(), filters] as const,
    details: () => [...queryKeys.courses.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.courses.details(), id] as const,
    withStats: (id: string) =>
      [...queryKeys.courses.all, "with-stats", id] as const,
    byTeacher: (teacherId: string) =>
      [...queryKeys.courses.all, "by-teacher", teacherId] as const,
    enrolled: (studentId: string) =>
      [...queryKeys.courses.all, "enrolled", studentId] as const,
  },

  // -------------------------------------------------------------------------
  // Tests
  // -------------------------------------------------------------------------
  tests: {
    all: ["tests"] as const,
    lists: () => [...queryKeys.tests.all, "list"] as const,
    list: (filters?: QueryOptions) =>
      [...queryKeys.tests.lists(), filters] as const,
    details: () => [...queryKeys.tests.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.tests.details(), id] as const,
    withSubjects: (id: string) =>
      [...queryKeys.tests.all, "with-subjects", id] as const,
    byCourse: (courseId: string) =>
      [...queryKeys.tests.all, "by-course", courseId] as const,
    publishedByCourse: (courseId: string) =>
      [...queryKeys.tests.all, "published-by-course", courseId] as const,
    subjects: (testId: string) =>
      [...queryKeys.tests.all, "subjects", testId] as const,
  },

  // -------------------------------------------------------------------------
  // Questions
  // -------------------------------------------------------------------------
  questions: {
    all: ["questions"] as const,
    lists: () => [...queryKeys.questions.all, "list"] as const,
    list: (filters?: QueryOptions) =>
      [...queryKeys.questions.lists(), filters] as const,
    details: () => [...queryKeys.questions.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.questions.details(), id] as const,
    byTest: (testId: string) =>
      [...queryKeys.questions.all, "by-test", testId] as const,
    bySubject: (testId: string, subjectId: string) =>
      [...queryKeys.questions.all, "by-subject", testId, subjectId] as const,
    count: (testId: string) =>
      [...queryKeys.questions.all, "count", testId] as const,
  },

  // -------------------------------------------------------------------------
  // Enrollments
  // -------------------------------------------------------------------------
  enrollments: {
    all: ["enrollments"] as const,
    lists: () => [...queryKeys.enrollments.all, "list"] as const,
    list: (filters?: QueryOptions) =>
      [...queryKeys.enrollments.lists(), filters] as const,
    details: () => [...queryKeys.enrollments.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.enrollments.details(), id] as const,
    byStudent: (studentId: string) =>
      [...queryKeys.enrollments.all, "by-student", studentId] as const,
    activeByStudent: (studentId: string) =>
      [...queryKeys.enrollments.all, "active-by-student", studentId] as const,
    byCourse: (courseId: string) =>
      [...queryKeys.enrollments.all, "by-course", courseId] as const,
    check: (studentId: string, courseId: string) =>
      [...queryKeys.enrollments.all, "check", studentId, courseId] as const,
    enrollment: (studentId: string, courseId: string) =>
      [...queryKeys.enrollments.all, "single", studentId, courseId] as const,
    count: (courseId: string) =>
      [...queryKeys.enrollments.all, "count", courseId] as const,
    recent: (limit?: number) =>
      [...queryKeys.enrollments.all, "recent", limit] as const,
  },

  // -------------------------------------------------------------------------
  // Purchases
  // -------------------------------------------------------------------------
  purchases: {
    all: ["purchases"] as const,
    lists: () => [...queryKeys.purchases.all, "list"] as const,
    list: (filters?: QueryOptions) =>
      [...queryKeys.purchases.lists(), filters] as const,
    details: () => [...queryKeys.purchases.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.purchases.details(), id] as const,
    byStudent: (studentId: string) =>
      [...queryKeys.purchases.all, "by-student", studentId] as const,
    byCourse: (courseId: string) =>
      [...queryKeys.purchases.all, "by-course", courseId] as const,
    check: (studentId: string, courseId: string) =>
      [...queryKeys.purchases.all, "check", studentId, courseId] as const,
    purchase: (studentId: string, courseId: string) =>
      [...queryKeys.purchases.all, "single", studentId, courseId] as const,
    revenue: (courseId: string) =>
      [...queryKeys.purchases.all, "revenue", courseId] as const,
    teacherRevenue: (courseIds: string[]) =>
      [...queryKeys.purchases.all, "teacher-revenue", courseIds] as const,
    count: (courseId: string) =>
      [...queryKeys.purchases.all, "count", courseId] as const,
    recent: (courseIds?: string[], limit?: number) =>
      [...queryKeys.purchases.all, "recent", courseIds, limit] as const,
  },

  // -------------------------------------------------------------------------
  // Test Attempts
  // -------------------------------------------------------------------------
  attempts: {
    all: ["attempts"] as const,
    lists: () => [...queryKeys.attempts.all, "list"] as const,
    list: (filters?: QueryOptions) =>
      [...queryKeys.attempts.lists(), filters] as const,
    details: () => [...queryKeys.attempts.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.attempts.details(), id] as const,
    byStudent: (studentId: string) =>
      [...queryKeys.attempts.all, "by-student", studentId] as const,
    byTest: (testId: string) =>
      [...queryKeys.attempts.all, "by-test", testId] as const,
    completedByTest: (testId: string) =>
      [...queryKeys.attempts.all, "completed-by-test", testId] as const,
    inProgress: (studentId: string, testId: string) =>
      [...queryKeys.attempts.all, "in-progress", studentId, testId] as const,
    best: (studentId: string, testId: string) =>
      [...queryKeys.attempts.all, "best", studentId, testId] as const,
    history: (studentId: string, testId: string) =>
      [...queryKeys.attempts.all, "history", studentId, testId] as const,
    stats: (testId: string) =>
      [...queryKeys.attempts.all, "stats", testId] as const,
  },

  // -------------------------------------------------------------------------
  // Activities
  // -------------------------------------------------------------------------
  activities: {
    all: ["activities"] as const,
    lists: () => [...queryKeys.activities.all, "list"] as const,
    list: (filters?: QueryOptions) =>
      [...queryKeys.activities.lists(), filters] as const,
    details: () => [...queryKeys.activities.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.activities.details(), id] as const,
    byUser: (userId: string) =>
      [...queryKeys.activities.all, "by-user", userId] as const,
    recent: (userId: string, limit?: number) =>
      [...queryKeys.activities.all, "recent", userId, limit] as const,
    byType: (userId: string, type: string) =>
      [...queryKeys.activities.all, "by-type", userId, type] as const,
    countByType: (userId: string) =>
      [...queryKeys.activities.all, "count-by-type", userId] as const,
  },
} as const;

// ============================================================================
// Cache Invalidation Utilities
// ============================================================================

/**
 * Invalidate all course-related queries
 */
export function invalidateCourses(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
}

/**
 * Invalidate a specific course and related queries
 */
export function invalidateCourse(queryClient: QueryClient, courseId: string) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeys.courses.detail(courseId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.courses.withStats(courseId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.tests.byCourse(courseId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.enrollments.byCourse(courseId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.purchases.byCourse(courseId),
    }),
  ]);
}

/**
 * Invalidate all test-related queries
 */
export function invalidateTests(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.tests.all });
}

/**
 * Invalidate a specific test and related queries
 */
export function invalidateTest(queryClient: QueryClient, testId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.tests.detail(testId) }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.tests.withSubjects(testId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.questions.byTest(testId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.attempts.byTest(testId),
    }),
  ]);
}

/**
 * Invalidate all question-related queries
 */
export function invalidateQuestions(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.questions.all });
}

/**
 * Invalidate questions for a specific test
 */
export function invalidateTestQuestions(
  queryClient: QueryClient,
  testId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.questions.byTest(testId),
  });
}

/**
 * Invalidate all enrollment-related queries
 */
export function invalidateEnrollments(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all });
}

/**
 * Invalidate enrollments for a student
 */
export function invalidateStudentEnrollments(
  queryClient: QueryClient,
  studentId: string,
) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeys.enrollments.byStudent(studentId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.enrollments.activeByStudent(studentId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.courses.enrolled(studentId),
    }),
  ]);
}

/**
 * Invalidate all purchase-related queries
 */
export function invalidatePurchases(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all });
}

/**
 * Invalidate purchases for a student
 */
export function invalidateStudentPurchases(
  queryClient: QueryClient,
  studentId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.purchases.byStudent(studentId),
  });
}

/**
 * Invalidate all attempt-related queries
 */
export function invalidateAttempts(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.attempts.all });
}

/**
 * Invalidate attempts for a student
 */
export function invalidateStudentAttempts(
  queryClient: QueryClient,
  studentId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.attempts.byStudent(studentId),
  });
}

/**
 * Invalidate a specific attempt
 */
export function invalidateAttempt(queryClient: QueryClient, attemptId: string) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.attempts.detail(attemptId),
  });
}

/**
 * Invalidate all activity-related queries
 */
export function invalidateActivities(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
}

/**
 * Invalidate activities for a user
 */
export function invalidateUserActivities(
  queryClient: QueryClient,
  userId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.activities.byUser(userId),
  });
}

/**
 * Comprehensive invalidation after a student completes an enrollment action
 * (enrolling in a course, completing a course)
 */
export function invalidateAfterEnrollment(
  queryClient: QueryClient,
  studentId: string,
  courseId: string,
) {
  return Promise.all([
    invalidateStudentEnrollments(queryClient, studentId),
    queryClient.invalidateQueries({
      queryKey: queryKeys.enrollments.byCourse(courseId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.enrollments.check(studentId, courseId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.enrollments.enrollment(studentId, courseId),
    }),
    invalidateUserActivities(queryClient, studentId),
  ]);
}

/**
 * Comprehensive invalidation after a student completes a purchase
 */
export function invalidateAfterPurchase(
  queryClient: QueryClient,
  studentId: string,
  courseId: string,
) {
  return Promise.all([
    invalidateStudentPurchases(queryClient, studentId),
    queryClient.invalidateQueries({
      queryKey: queryKeys.purchases.byCourse(courseId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.purchases.check(studentId, courseId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.purchases.revenue(courseId),
    }),
  ]);
}

/**
 * Comprehensive invalidation after a test attempt
 * (starting, submitting, completing)
 */
export function invalidateAfterAttempt(
  queryClient: QueryClient,
  studentId: string,
  testId: string,
  attemptId?: string,
) {
  const invalidations = [
    invalidateStudentAttempts(queryClient, studentId),
    queryClient.invalidateQueries({
      queryKey: queryKeys.attempts.byTest(testId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.attempts.inProgress(studentId, testId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.attempts.best(studentId, testId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.attempts.history(studentId, testId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.attempts.stats(testId),
    }),
    invalidateUserActivities(queryClient, studentId),
  ];

  if (attemptId) {
    invalidations.push(invalidateAttempt(queryClient, attemptId));
  }

  return Promise.all(invalidations);
}
