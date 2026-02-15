/**
 * Student Stats Analytics
 *
 * Functions for calculating student-level statistics.
 */

import { countRows, fetchAllRows, TABLES } from "../../supabase-helpers";
import type { EnrollmentRow, PurchaseRow, TestAttemptRow } from "../types";

/**
 * Get detailed stats for a specific student
 */
export async function getStudentStats(studentId: string): Promise<{
  enrolledCourses: number;
  completedTests: number;
  averageScore: number;
  totalSpent: number;
}> {
  const [enrollments, attempts, purchases] = await Promise.all([
    fetchAllRows<EnrollmentRow>(TABLES.enrollments, (q) =>
      q.eq("student_id", studentId),
    ),
    fetchAllRows<TestAttemptRow>(TABLES.test_attempts, (q) =>
      q.eq("student_id", studentId).eq("status", "completed"),
    ),
    fetchAllRows<PurchaseRow>(TABLES.purchases, (q) =>
      q.eq("student_id", studentId),
    ),
  ]);

  const enrolledCourses = enrollments.length;
  const completedTests = attempts.length;
  const averageScore =
    attempts.length > 0
      ? attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) /
        attempts.length
      : 0;

  const totalSpent = purchases.reduce((sum, p) => sum + p.amount, 0);

  return {
    enrolledCourses,
    completedTests,
    averageScore,
    totalSpent,
  };
}

/**
 * Get stats for multiple students in batch (for students list)
 */
export async function getStudentsWithStats(studentIds: string[]): Promise<
  Map<
    string,
    {
      enrolledCourses: number;
      completedTests: number;
      averageScore: number;
      totalSpent: number;
    }
  >
> {
  if (studentIds.length === 0) {
    return new Map();
  }

  const [enrollments, attempts, purchases] = await Promise.all([
    fetchAllRows<EnrollmentRow>(TABLES.enrollments, (q) =>
      q.in("student_id", studentIds),
    ),
    fetchAllRows<TestAttemptRow>(TABLES.test_attempts, (q) =>
      q.in("student_id", studentIds).eq("status", "completed"),
    ),
    fetchAllRows<PurchaseRow>(TABLES.purchases, (q) =>
      q.in("student_id", studentIds),
    ),
  ]);

  const statsMap = new Map<
    string,
    {
      enrolledCourses: number;
      completedTests: number;
      totalScore: number;
      attemptCount: number;
      totalSpent: number;
    }
  >();

  studentIds.forEach((id) => {
    statsMap.set(id, {
      enrolledCourses: 0,
      completedTests: 0,
      totalScore: 0,
      attemptCount: 0,
      totalSpent: 0,
    });
  });

  enrollments.forEach((enrollment) => {
    const stats = statsMap.get(enrollment.student_id);
    if (stats) {
      stats.enrolledCourses += 1;
    }
  });

  attempts.forEach((attempt) => {
    const stats = statsMap.get(attempt.student_id);
    if (stats) {
      stats.completedTests += 1;
      stats.totalScore += attempt.percentage || 0;
      stats.attemptCount += 1;
    }
  });

  purchases.forEach((purchase) => {
    const stats = statsMap.get(purchase.student_id);
    if (stats) {
      stats.totalSpent += purchase.amount;
    }
  });

  const result = new Map<
    string,
    {
      enrolledCourses: number;
      completedTests: number;
      averageScore: number;
      totalSpent: number;
    }
  >();

  statsMap.forEach((stats, studentId) => {
    result.set(studentId, {
      enrolledCourses: stats.enrolledCourses,
      completedTests: stats.completedTests,
      averageScore:
        stats.attemptCount > 0 ? stats.totalScore / stats.attemptCount : 0,
      totalSpent: stats.totalSpent,
    });
  });

  return result;
}

/**
 * Get attempt count for a specific test by student
 */
export async function getTestAttemptCount(
  studentId: string,
  testId: string,
): Promise<number> {
  return countRows(TABLES.test_attempts, (q) =>
    q.eq("student_id", studentId).eq("test_id", testId),
  );
}
