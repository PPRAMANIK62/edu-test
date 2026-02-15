/**
 * Student Engagement Analytics
 *
 * Functions for calculating student engagement and completion metrics.
 */

import type { StudentEngagementMetrics } from "@/types";
import { Query } from "appwrite";
import { APPWRITE_CONFIG } from "../../appwrite";
import { fetchAllRows } from "../../appwrite-helpers";
import type { EnrollmentDocument, TestAttemptDocument } from "../types";

const { tables } = APPWRITE_CONFIG;

/**
 * Calculate student engagement metrics for a course
 */
export async function getStudentEngagementMetrics(
  courseId: string,
): Promise<StudentEngagementMetrics> {
  const [enrollmentResponse, attemptResponse] = await Promise.all([
    fetchAllRows<EnrollmentDocument>(tables.enrollments!, [
      Query.equal("courseId", courseId),
    ]),
    fetchAllRows<TestAttemptDocument>(tables.testAttempts!, [
      Query.equal("courseId", courseId),
      Query.equal("status", "completed"),
    ]),
  ]);

  const enrollments = enrollmentResponse.rows;
  const totalStudents = enrollments.length;
  const testAttempts = attemptResponse.rows;

  // Calculate active students (those with at least one test attempt)
  const studentsWithAttempts = new Set(testAttempts.map((t) => t.studentId));
  const activeStudents = studentsWithAttempts.size;

  // Calculate average test score
  const averageTestScore =
    testAttempts.length > 0
      ? testAttempts.reduce((sum, t) => sum + (t.percentage || 0), 0) /
        testAttempts.length
      : 0;

  // Calculate completion rate
  const completedEnrollments = enrollments.filter(
    (e) => e.status === "completed",
  );
  const completionRate =
    totalStudents > 0 ? (completedEnrollments.length / totalStudents) * 100 : 0;

  return {
    totalStudents,
    activeStudents,
    averageTestScore,
    totalTestAttempts: testAttempts.length,
    completionRate,
  };
}

/**
 * Get average completion rate across all students for a teacher's courses
 */
export async function getAverageCompletionRate(
  courseIds: string[],
): Promise<number> {
  if (courseIds.length === 0) return 0;

  const enrollmentResponse = await fetchAllRows<EnrollmentDocument>(
    tables.enrollments!,
    [Query.equal("courseId", courseIds)],
  );

  const enrollments = enrollmentResponse.rows;
  if (enrollments.length === 0) return 0;

  const completedCount = enrollments.filter(
    (e) => e.status === "completed",
  ).length;
  return (completedCount / enrollments.length) * 100;
}
