/**
 * Student Engagement Analytics
 *
 * Functions for calculating student engagement and completion metrics.
 */

import type { StudentEngagementMetrics } from "@/types";
import { fetchAllRows, TABLES } from "../../supabase-helpers";
import type { EnrollmentRow, TestAttemptRow } from "../types";

/**
 * Calculate student engagement metrics for a course
 */
export async function getStudentEngagementMetrics(
  courseId: string,
): Promise<StudentEngagementMetrics> {
  const [enrollments, testAttempts] = await Promise.all([
    fetchAllRows<EnrollmentRow>(TABLES.enrollments, (q) =>
      q.eq("course_id", courseId),
    ),
    fetchAllRows<TestAttemptRow>(TABLES.test_attempts, (q) =>
      q.eq("course_id", courseId).eq("status", "completed"),
    ),
  ]);

  const totalStudents = enrollments.length;

  const studentsWithAttempts = new Set(testAttempts.map((t) => t.student_id));
  const activeStudents = studentsWithAttempts.size;

  const averageTestScore =
    testAttempts.length > 0
      ? testAttempts.reduce((sum, t) => sum + (t.percentage || 0), 0) /
        testAttempts.length
      : 0;

  const completedEnrollments = enrollments.filter(
    (e) => e.status === "completed",
  );
  const completionRate =
    totalStudents > 0 ? (completedEnrollments.length / totalStudents) * 100 : 0;

  return {
    total_students: totalStudents,
    active_students: activeStudents,
    average_test_score: averageTestScore,
    total_test_attempts: testAttempts.length,
    completion_rate: completionRate,
  };
}

/**
 * Get average completion rate across all students for a teacher's courses
 */
export async function getAverageCompletionRate(
  courseIds: string[],
): Promise<number> {
  if (courseIds.length === 0) return 0;

  const enrollments = await fetchAllRows<EnrollmentRow>(
    TABLES.enrollments,
    (q) => q.in("course_id", courseIds),
  );

  if (enrollments.length === 0) return 0;

  const completedCount = enrollments.filter(
    (e) => e.status === "completed",
  ).length;
  return (completedCount / enrollments.length) * 100;
}
