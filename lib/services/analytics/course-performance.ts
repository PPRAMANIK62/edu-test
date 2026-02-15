/**
 * Course Performance Analytics
 *
 * Functions for calculating course-level performance metrics.
 */

import type { AnalyticsQueryOptions, CoursePerformanceMetrics } from "@/types";
import { supabase } from "../../supabase";
import { fetchAllRows, TABLES } from "../../supabase-helpers";
import { getDateRangeFromFilter } from "../helpers";
import type {
  CourseRow,
  EnrollmentRow,
  PurchaseRow,
  TestAttemptRow,
} from "../types";
import { calculatePercentageChange, getPreviousPeriodRange } from "./helpers";

/**
 * Calculate course performance metrics from database
 */
export async function getCoursePerformanceMetrics(
  courseId: string,
  options: AnalyticsQueryOptions = {},
): Promise<CoursePerformanceMetrics> {
  const { time_range = "30d" } = options;

  // Get course info
  const { data: course, error: courseError } = await supabase
    .from(TABLES.courses)
    .select("*")
    .eq("id", courseId)
    .single();

  if (courseError || !course) {
    throw new Error(`Course ${courseId} not found`);
  }

  const typedCourse = course as CourseRow;

  // Build date range
  const { start: currentStart } = getDateRangeFromFilter(time_range);

  // Get enrollments for this course in current period
  const [enrollments, purchases] = await Promise.all([
    fetchAllRows<EnrollmentRow>(TABLES.enrollments, (q) => {
      let query = q.eq("course_id", courseId);
      if (currentStart) {
        query = query.gte("enrolled_at", currentStart.toISOString());
      }
      return query;
    }),
    fetchAllRows<PurchaseRow>(TABLES.purchases, (q) => {
      let query = q.eq("course_id", courseId);
      if (currentStart) {
        query = query.gte("purchased_at", currentStart.toISOString());
      }
      return query;
    }),
  ]);

  // Calculate current period metrics
  const totalRevenue = purchases.reduce((sum, p) => sum + p.amount, 0);
  const totalEnrollments = enrollments.length;
  const completionRate =
    enrollments.length > 0
      ? (enrollments.filter((e) => e.status === "completed").length /
          enrollments.length) *
        100
      : 0;

  // Calculate previous period metrics for trends
  const previousRange = getPreviousPeriodRange(time_range);

  const [previousEnrollments, previousPurchases] = await Promise.all([
    fetchAllRows<EnrollmentRow>(TABLES.enrollments, (q) =>
      q
        .eq("course_id", courseId)
        .gte("enrolled_at", previousRange.start.toISOString())
        .lte("enrolled_at", previousRange.end.toISOString()),
    ),
    fetchAllRows<PurchaseRow>(TABLES.purchases, (q) =>
      q
        .eq("course_id", courseId)
        .gte("purchased_at", previousRange.start.toISOString())
        .lte("purchased_at", previousRange.end.toISOString()),
    ),
  ]);

  const previousRevenue = previousPurchases.reduce(
    (sum, p) => sum + p.amount,
    0,
  );
  const previousEnrollmentCount = previousEnrollments.length;

  // Calculate trends
  const revenueChange = calculatePercentageChange(
    totalRevenue,
    previousRevenue,
  );
  const enrollmentChange = calculatePercentageChange(
    totalEnrollments,
    previousEnrollmentCount,
  );

  return {
    course_id: courseId,
    course_title: typedCourse.title,
    total_revenue: totalRevenue,
    total_enrollments: totalEnrollments,
    average_rating: 0, // Rating system not implemented yet
    completion_rate: completionRate,
    trends: {
      revenue_change: revenueChange,
      enrollment_change: enrollmentChange,
      rating_change: 0, // No historical rating data
    },
  };
}

/**
 * Get analytics summary for a single course
 */
export async function getCourseAnalyticsSummary(courseId: string): Promise<{
  enrollmentCount: number;
  completedCount: number;
  totalRevenue: number;
  averageTestScore: number;
  totalAttempts: number;
}> {
  const [enrollments, purchases, attempts] = await Promise.all([
    fetchAllRows<EnrollmentRow>(TABLES.enrollments, (q) =>
      q.eq("course_id", courseId),
    ),
    fetchAllRows<PurchaseRow>(TABLES.purchases, (q) =>
      q.eq("course_id", courseId),
    ),
    fetchAllRows<TestAttemptRow>(TABLES.test_attempts, (q) =>
      q.eq("course_id", courseId).eq("status", "completed"),
    ),
  ]);

  const enrollmentCount = enrollments.length;
  const completedCount = enrollments.filter(
    (e) => e.status === "completed",
  ).length;

  const totalRevenue = purchases.reduce((sum, p) => sum + p.amount, 0);

  const totalAttempts = attempts.length;
  const averageTestScore =
    attempts.length > 0
      ? attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) /
        attempts.length
      : 0;

  return {
    enrollmentCount,
    completedCount,
    totalRevenue,
    averageTestScore,
    totalAttempts,
  };
}

/**
 * Get course performance data with real enrollment counts
 */
export async function getCoursePerformanceData(courseIds: string[]): Promise<
  Map<
    string,
    {
      enrollmentCount: number;
      revenue: number;
      recentEnrollments: number;
    }
  >
> {
  if (courseIds.length === 0) {
    return new Map();
  }

  const [enrollments, purchases] = await Promise.all([
    fetchAllRows<EnrollmentRow>(TABLES.enrollments, (q) =>
      q.in("course_id", courseIds),
    ),
    fetchAllRows<PurchaseRow>(TABLES.purchases, (q) =>
      q.in("course_id", courseIds),
    ),
  ]);

  // Calculate recent enrollments (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = new Map<
    string,
    {
      enrollmentCount: number;
      revenue: number;
      recentEnrollments: number;
    }
  >();

  // Initialize all courses
  courseIds.forEach((id) => {
    result.set(id, {
      enrollmentCount: 0,
      revenue: 0,
      recentEnrollments: 0,
    });
  });

  // Count enrollments
  enrollments.forEach((enrollment) => {
    const stats = result.get(enrollment.course_id);
    if (stats) {
      stats.enrollmentCount += 1;
      if (new Date(enrollment.enrolled_at) >= thirtyDaysAgo) {
        stats.recentEnrollments += 1;
      }
    }
  });

  // Sum revenue
  purchases.forEach((purchase) => {
    const stats = result.get(purchase.course_id);
    if (stats) {
      stats.revenue += purchase.amount;
    }
  });

  return result;
}
