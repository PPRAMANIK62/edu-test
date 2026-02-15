/**
 * Revenue Analytics
 *
 * Functions for calculating revenue metrics for teachers.
 */

import type { AnalyticsQueryOptions, RevenueMetrics } from "@/types";
import { supabase } from "../../supabase";
import { fetchAllRows, TABLES } from "../../supabase-helpers";
import { getDateRangeFromFilter } from "../helpers";
import type { CourseRow, EnrollmentRow, PurchaseRow, TestRow } from "../types";
import { calculatePercentageChange, getPreviousPeriodRange } from "./helpers";

/**
 * Calculate revenue analytics for a teacher
 */
export async function getRevenueAnalytics(
  teacherId: string,
  options: AnalyticsQueryOptions = {},
): Promise<RevenueMetrics> {
  const { time_range = "30d" } = options;

  // Get teacher's courses
  const { data: courseData, error: courseError } = await supabase
    .from(TABLES.courses)
    .select("*")
    .eq("teacher_id", teacherId)
    .limit(100);

  if (courseError) throw courseError;

  const teacherCourses = (courseData ?? []) as CourseRow[];
  const courseIds = teacherCourses.map((c) => c.id);

  if (courseIds.length === 0) {
    return {
      total_revenue: 0,
      revenue_by_month: [],
      top_courses: [],
      trends: {
        percentage_change: 0,
        comparison_period: `vs. previous ${time_range}`,
      },
    };
  }

  const { start: currentStart } = getDateRangeFromFilter(time_range);

  const purchases = await fetchAllRows<PurchaseRow>(TABLES.purchases, (q) => {
    let query = q.in("course_id", courseIds);
    if (currentStart) {
      query = query.gte("purchased_at", currentStart.toISOString());
    }
    return query;
  });

  const totalRevenue = purchases.reduce((sum, p) => sum + p.amount, 0);

  // Calculate revenue by month
  const monthlyRevenue = new Map<string, number>();

  purchases.forEach((purchase) => {
    const date = new Date(purchase.purchased_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyRevenue.set(
      monthKey,
      (monthlyRevenue.get(monthKey) || 0) + purchase.amount,
    );
  });

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
      purchase.course_id,
      (courseRevenue.get(purchase.course_id) || 0) + purchase.amount,
    );
  });

  const topCourseIds = Array.from(courseRevenue.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const enrollmentCountsMap = new Map<string, number>();
  const testCountsMap = new Map<string, number>();
  if (topCourseIds.length > 0) {
    const [topEnrollments, topTests] = await Promise.all([
      fetchAllRows<EnrollmentRow>(TABLES.enrollments, (q) =>
        q.in("course_id", topCourseIds),
      ),
      fetchAllRows<TestRow>(TABLES.tests, (q) =>
        q.in("course_id", topCourseIds),
      ),
    ]);

    topEnrollments.forEach((enrollment) => {
      enrollmentCountsMap.set(
        enrollment.course_id,
        (enrollmentCountsMap.get(enrollment.course_id) || 0) + 1,
      );
    });

    topTests.forEach((test) => {
      testCountsMap.set(
        test.course_id,
        (testCountsMap.get(test.course_id) || 0) + 1,
      );
    });
  }

  const topCourses = topCourseIds.map((id) => {
    const course = teacherCourses.find((c) => c.id === id);
    return {
      course_id: id,
      course_title: course?.title || "Unknown Course",
      revenue: courseRevenue.get(id) || 0,
      enrollment_count: enrollmentCountsMap.get(id) || 0,
      test_count: testCountsMap.get(id) || 0,
    };
  });

  // Calculate previous period for trends
  const previousRange = getPreviousPeriodRange(time_range);

  const previousPurchases = await fetchAllRows<PurchaseRow>(
    TABLES.purchases,
    (q) =>
      q
        .in("course_id", courseIds)
        .gte("purchased_at", previousRange.start.toISOString())
        .lte("purchased_at", previousRange.end.toISOString()),
  );

  const previousRevenue = previousPurchases.reduce(
    (sum, p) => sum + p.amount,
    0,
  );
  const percentageChange = calculatePercentageChange(
    totalRevenue,
    previousRevenue,
  );

  return {
    total_revenue: totalRevenue,
    revenue_by_month: revenueByMonth,
    top_courses: topCourses,
    trends: {
      percentage_change: percentageChange,
      comparison_period: `vs. previous ${time_range}`,
    },
  };
}
