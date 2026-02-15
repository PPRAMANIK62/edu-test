/**
 * Course Performance Analytics
 *
 * Functions for calculating course-level performance metrics.
 */

import type { AnalyticsQueryOptions, CoursePerformanceMetrics } from "@/types";
import { Query } from "appwrite";
import { APPWRITE_CONFIG, databases } from "../../appwrite";
import { fetchAllRows } from "../../appwrite-helpers";
import { dateRangeQuery, getDateRangeFromFilter } from "../helpers";
import type {
  CourseDocument,
  EnrollmentDocument,
  PurchaseDocument,
  TestAttemptDocument,
} from "../types";
import { calculatePercentageChange, getPreviousPeriodRange } from "./helpers";

const { databaseId, tables } = APPWRITE_CONFIG;

/**
 * Calculate course performance metrics from database
 */
export async function getCoursePerformanceMetrics(
  courseId: string,
  options: AnalyticsQueryOptions = {},
): Promise<CoursePerformanceMetrics> {
  const { timeRange = "30d" } = options;

  // Get course info
  const course = await databases.getRow<CourseDocument>({
    databaseId: databaseId!,
    tableId: tables.courses!,
    rowId: courseId,
  });

  if (!course) {
    throw new Error(`Course ${courseId} not found`);
  }

  // Build date range queries
  const { start: currentStart } = getDateRangeFromFilter(timeRange);
  const currentDateQueries = currentStart
    ? dateRangeQuery("enrolledAt", currentStart)
    : [];
  const currentPurchaseDateQueries = currentStart
    ? dateRangeQuery("purchasedAt", currentStart)
    : [];

  // Get enrollments for this course in current period
  const enrollmentQueries = [
    Query.equal("courseId", courseId),
    ...currentDateQueries,
  ];

  const purchaseQueries = [
    Query.equal("courseId", courseId),
    ...currentPurchaseDateQueries,
  ];

  const [enrollmentResponse, purchaseResponse] = await Promise.all([
    fetchAllRows<EnrollmentDocument>(tables.enrollments!, enrollmentQueries),
    fetchAllRows<PurchaseDocument>(tables.purchases!, purchaseQueries),
  ]);

  const enrollments = enrollmentResponse.rows;
  const purchases = purchaseResponse.rows;

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
  const previousRange = getPreviousPeriodRange(timeRange);

  const previousEnrollmentQueries = [
    Query.equal("courseId", courseId),
    ...dateRangeQuery("enrolledAt", previousRange.start, previousRange.end),
  ];

  const previousPurchaseQueries = [
    Query.equal("courseId", courseId),
    ...dateRangeQuery("purchasedAt", previousRange.start, previousRange.end),
  ];

  const [previousEnrollmentResponse, previousPurchaseResponse] =
    await Promise.all([
      fetchAllRows<EnrollmentDocument>(
        tables.enrollments!,
        previousEnrollmentQueries,
      ),
      fetchAllRows<PurchaseDocument>(
        tables.purchases!,
        previousPurchaseQueries,
      ),
    ]);

  const previousRevenue = previousPurchaseResponse.rows.reduce(
    (sum, p) => sum + p.amount,
    0,
  );
  const previousEnrollmentCount = previousEnrollmentResponse.total;

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
    courseId,
    courseTitle: course.title,
    totalRevenue,
    totalEnrollments,
    averageRating: 0, // Rating system not implemented yet
    completionRate,
    trends: {
      revenueChange,
      enrollmentChange,
      ratingChange: 0, // No historical rating data
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
  const [enrollmentResponse, purchaseResponse, attemptResponse] =
    await Promise.all([
      fetchAllRows<EnrollmentDocument>(tables.enrollments!, [
        Query.equal("courseId", courseId),
      ]),
      fetchAllRows<PurchaseDocument>(tables.purchases!, [
        Query.equal("courseId", courseId),
      ]),
      fetchAllRows<TestAttemptDocument>(tables.testAttempts!, [
        Query.equal("courseId", courseId),
        Query.equal("status", "completed"),
      ]),
    ]);

  const enrollments = enrollmentResponse.rows;
  const enrollmentCount = enrollments.length;
  const completedCount = enrollments.filter(
    (e) => e.status === "completed",
  ).length;

  const totalRevenue = purchaseResponse.rows.reduce(
    (sum, p) => sum + p.amount,
    0,
  );

  const attempts = attemptResponse.rows;
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

  const [enrollmentResponse, purchaseResponse] = await Promise.all([
    fetchAllRows<EnrollmentDocument>(tables.enrollments!, [
      Query.equal("courseId", courseIds),
    ]),
    fetchAllRows<PurchaseDocument>(tables.purchases!, [
      Query.equal("courseId", courseIds),
    ]),
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
  enrollmentResponse.rows.forEach((enrollment) => {
    const stats = result.get(enrollment.courseId);
    if (stats) {
      stats.enrollmentCount += 1;
      if (new Date(enrollment.enrolledAt) >= thirtyDaysAgo) {
        stats.recentEnrollments += 1;
      }
    }
  });

  // Sum revenue
  purchaseResponse.rows.forEach((purchase) => {
    const stats = result.get(purchase.courseId);
    if (stats) {
      stats.revenue += purchase.amount;
    }
  });

  return result;
}
