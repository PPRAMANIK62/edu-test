/**
 * Student Stats Analytics
 *
 * Functions for calculating student-level statistics.
 */

import { Query } from "appwrite";
import { APPWRITE_CONFIG, databases } from "../../appwrite";
import { fetchAllRows } from "../../appwrite-helpers";
import type {
  EnrollmentDocument,
  PurchaseDocument,
  TestAttemptDocument,
} from "../types";

const { databaseId, tables } = APPWRITE_CONFIG;

/**
 * Get detailed stats for a specific student
 */
export async function getStudentStats(studentId: string): Promise<{
  enrolledCourses: number;
  completedTests: number;
  averageScore: number;
  totalSpent: number;
}> {
  const [enrollmentResponse, attemptResponse, purchaseResponse] =
    await Promise.all([
      fetchAllRows<EnrollmentDocument>(tables.enrollments!, [
        Query.equal("studentId", studentId),
      ]),
      fetchAllRows<TestAttemptDocument>(tables.testAttempts!, [
        Query.equal("studentId", studentId),
        Query.equal("status", "completed"),
      ]),
      fetchAllRows<PurchaseDocument>(tables.purchases!, [
        Query.equal("studentId", studentId),
      ]),
    ]);

  const enrolledCourses = enrollmentResponse.total;

  const attempts = attemptResponse.rows;
  const completedTests = attempts.length;
  const averageScore =
    attempts.length > 0
      ? attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) /
        attempts.length
      : 0;

  const totalSpent = purchaseResponse.rows.reduce(
    (sum, p) => sum + p.amount,
    0,
  );

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

  const [enrollmentResponse, attemptResponse, purchaseResponse] =
    await Promise.all([
      fetchAllRows<EnrollmentDocument>(tables.enrollments!, [
        Query.equal("studentId", studentIds),
      ]),
      fetchAllRows<TestAttemptDocument>(tables.testAttempts!, [
        Query.equal("studentId", studentIds),
        Query.equal("status", "completed"),
      ]),
      fetchAllRows<PurchaseDocument>(tables.purchases!, [
        Query.equal("studentId", studentIds),
      ]),
    ]);

  // Aggregate data per student
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

  // Initialize all students
  studentIds.forEach((id) => {
    statsMap.set(id, {
      enrolledCourses: 0,
      completedTests: 0,
      totalScore: 0,
      attemptCount: 0,
      totalSpent: 0,
    });
  });

  // Count enrollments
  enrollmentResponse.rows.forEach((enrollment) => {
    const stats = statsMap.get(enrollment.studentId);
    if (stats) {
      stats.enrolledCourses += 1;
    }
  });

  // Count attempts and scores
  attemptResponse.rows.forEach((attempt) => {
    const stats = statsMap.get(attempt.studentId);
    if (stats) {
      stats.completedTests += 1;
      stats.totalScore += attempt.percentage || 0;
      stats.attemptCount += 1;
    }
  });

  // Sum purchases
  purchaseResponse.rows.forEach((purchase) => {
    const stats = statsMap.get(purchase.studentId);
    if (stats) {
      stats.totalSpent += purchase.amount;
    }
  });

  // Convert to final format with computed averages
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
  const response = await databases.listRows<TestAttemptDocument>({
    databaseId: databaseId!,
    tableId: tables.testAttempts!,
    queries: [
      Query.equal("studentId", studentId),
      Query.equal("testId", testId),
      Query.limit(1),
    ],
  });

  return response.total;
}
