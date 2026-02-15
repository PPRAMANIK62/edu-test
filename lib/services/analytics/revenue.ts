/**
 * Revenue Analytics
 *
 * Functions for calculating revenue metrics for teachers.
 */

import type { AnalyticsQueryOptions, RevenueMetrics } from "@/types";
import { Query } from "appwrite";
import { APPWRITE_CONFIG, databases } from "../../appwrite";
import { fetchAllRows } from "../../appwrite-helpers";
import { dateRangeQuery, getDateRangeFromFilter } from "../helpers";
import type {
  CourseDocument,
  EnrollmentDocument,
  PurchaseDocument,
  TestDocument,
} from "../types";
import { calculatePercentageChange, getPreviousPeriodRange } from "./helpers";

const { databaseId, tables } = APPWRITE_CONFIG;

/**
 * Calculate revenue analytics for a teacher
 */
export async function getRevenueAnalytics(
  teacherId: string,
  options: AnalyticsQueryOptions = {},
): Promise<RevenueMetrics> {
  const { timeRange = "30d" } = options;

  // Get teacher's courses
  const courseResponse = await databases.listRows<CourseDocument>({
    databaseId: databaseId!,
    tableId: tables.courses!,
    queries: [Query.equal("teacherId", teacherId), Query.limit(100)],
  });

  const teacherCourses = courseResponse.rows as CourseDocument[];
  const courseIds = teacherCourses.map((c) => c.$id);

  if (courseIds.length === 0) {
    return {
      totalRevenue: 0,
      revenueByMonth: [],
      topCourses: [],
      trends: {
        percentageChange: 0,
        comparisonPeriod: `vs. previous ${timeRange}`,
      },
    };
  }

  // Build date range queries
  const { start: currentStart } = getDateRangeFromFilter(timeRange);
  const currentDateQueries = currentStart
    ? dateRangeQuery("purchasedAt", currentStart)
    : [];

  // Get all purchases for teacher's courses in current period
  // Note: Appwrite Query.equal with array does an OR operation
  const purchaseQueries = [
    Query.equal("courseId", courseIds),
    ...currentDateQueries,
  ];

  const purchaseResponse = await fetchAllRows<PurchaseDocument>(
    tables.purchases!,
    purchaseQueries,
  );

  const purchases = purchaseResponse.rows;

  // Calculate total revenue
  const totalRevenue = purchases.reduce((sum, p) => sum + p.amount, 0);

  // Calculate revenue by month
  const monthlyRevenue = new Map<string, number>();

  purchases.forEach((purchase) => {
    const date = new Date(purchase.purchasedAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyRevenue.set(
      monthKey,
      (monthlyRevenue.get(monthKey) || 0) + purchase.amount,
    );
  });

  // Sort by month and format
  const sortedMonths = Array.from(monthlyRevenue.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  const revenueByMonth = sortedMonths.map(([month, revenue]) => {
    const [year, monthNum] = month.split("-");
    const monthName = new Date(
      parseInt(year),
      parseInt(monthNum) - 1,
    ).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    return { month: monthName, revenue };
  });

  // Calculate top courses by revenue
  const courseRevenue = new Map<string, number>();
  purchases.forEach((purchase) => {
    courseRevenue.set(
      purchase.courseId,
      (courseRevenue.get(purchase.courseId) || 0) + purchase.amount,
    );
  });

  // Get top 5 courses by revenue
  const topCourseIds = Array.from(courseRevenue.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([courseId]) => courseId);

  const enrollmentCountsMap = new Map<string, number>();
  const testCountsMap = new Map<string, number>();
  if (topCourseIds.length > 0) {
    const [enrollmentResponse, testResponse] = await Promise.all([
      fetchAllRows<EnrollmentDocument>(tables.enrollments!, [
        Query.equal("courseId", topCourseIds),
      ]),
      fetchAllRows<TestDocument>(tables.tests!, [
        Query.equal("courseId", topCourseIds),
      ]),
    ]);

    enrollmentResponse.rows.forEach((enrollment) => {
      enrollmentCountsMap.set(
        enrollment.courseId,
        (enrollmentCountsMap.get(enrollment.courseId) || 0) + 1,
      );
    });

    testResponse.rows.forEach((test) => {
      testCountsMap.set(
        test.courseId,
        (testCountsMap.get(test.courseId) || 0) + 1,
      );
    });
  }

  // Build top courses with stats
  const topCourses = topCourseIds.map((courseId) => {
    const course = teacherCourses.find((c) => c.$id === courseId);
    return {
      courseId,
      courseTitle: course?.title || "Unknown Course",
      revenue: courseRevenue.get(courseId) || 0,
      enrollmentCount: enrollmentCountsMap.get(courseId) || 0,
      testCount: testCountsMap.get(courseId) || 0,
    };
  });

  // Calculate previous period for trends
  const previousRange = getPreviousPeriodRange(timeRange);

  const previousPurchaseQueries = [
    Query.equal("courseId", courseIds),
    ...dateRangeQuery("purchasedAt", previousRange.start, previousRange.end),
  ];

  const previousPurchaseResponse = await fetchAllRows<PurchaseDocument>(
    tables.purchases!,
    previousPurchaseQueries,
  );

  const previousRevenue = previousPurchaseResponse.rows.reduce(
    (sum, p) => sum + p.amount,
    0,
  );
  const percentageChange = calculatePercentageChange(
    totalRevenue,
    previousRevenue,
  );

  return {
    totalRevenue,
    revenueByMonth,
    topCourses,
    trends: {
      percentageChange,
      comparisonPeriod: `vs. previous ${timeRange}`,
    },
  };
}
