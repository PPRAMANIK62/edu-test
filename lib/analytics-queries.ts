/**
 * Analytics Query Functions
 *
 * Database-driven analytics that calculate teacher metrics from existing data.
 * Currently uses mock data; designed for easy migration to Appwrite database queries.
 */

import {
  MOCK_COURSES,
  MOCK_ENROLLMENTS,
  MOCK_PURCHASES,
  MOCK_TEST_ATTEMPTS,
} from "@/lib/mockdata";
import type {
  AnalyticsQueryOptions,
  CoursePerformanceMetrics,
  RevenueMetrics,
  StudentEngagementMetrics,
  TimeRangeFilter,
} from "@/types";

/**
 * Filter data by time range
 */
function filterByTimeRange<T extends { [key: string]: any }>(
  data: T[],
  dateField: keyof T,
  timeRange?: TimeRangeFilter
): T[] {
  if (!timeRange || timeRange === "all") {
    return data;
  }

  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const rangeMap: Record<TimeRangeFilter, number> = {
    "7d": 7 * msPerDay,
    "30d": 30 * msPerDay,
    "90d": 90 * msPerDay,
    "1y": 365 * msPerDay,
    all: 0,
  };

  const cutoffTime = now.getTime() - rangeMap[timeRange];

  return data.filter((item) => {
    const itemDate = new Date(item[dateField] as string);
    return itemDate.getTime() >= cutoffTime;
  });
}

/**
 * Get previous period date range for trend calculations
 */
function getPreviousPeriodRange(timeRange: TimeRangeFilter): {
  start: Date;
  end: Date;
} {
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;

  const rangeMs: Record<TimeRangeFilter, number> = {
    "7d": 7 * msPerDay,
    "30d": 30 * msPerDay,
    "90d": 90 * msPerDay,
    "1y": 365 * msPerDay,
    all: 365 * msPerDay, // For "all", compare to previous year
  };

  const currentPeriodMs = rangeMs[timeRange];
  const end = new Date(now.getTime() - currentPeriodMs);
  const start = new Date(end.getTime() - currentPeriodMs);

  return { start, end };
}

/**
 * Calculate percentage change
 */
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate course performance metrics from database
 */
export async function getCoursePerformanceMetrics(
  courseId: string,
  options: AnalyticsQueryOptions = {}
): Promise<CoursePerformanceMetrics> {
  const { timeRange = "30d" } = options;

  // Simulate async database query
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Get course info
  const course = MOCK_COURSES.find((c) => c.id === courseId);
  if (!course) {
    throw new Error(`Course ${courseId} not found`);
  }

  // Filter data by time range
  const enrollments = filterByTimeRange(
    MOCK_ENROLLMENTS.filter((e) => e.courseId === courseId),
    "enrolledAt",
    timeRange
  );

  const purchases = filterByTimeRange(
    MOCK_PURCHASES.filter((p) => p.courseId === courseId),
    "purchasedAt",
    timeRange
  );

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
  const previousEnrollments = MOCK_ENROLLMENTS.filter((e) => {
    if (e.courseId !== courseId) return false;
    const date = new Date(e.enrolledAt);
    return date >= previousRange.start && date < previousRange.end;
  });

  const previousPurchases = MOCK_PURCHASES.filter((p) => {
    if (p.courseId !== courseId) return false;
    const date = new Date(p.purchasedAt);
    return date >= previousRange.start && date < previousRange.end;
  });

  const previousRevenue = previousPurchases.reduce(
    (sum, p) => sum + p.amount,
    0
  );
  const previousEnrollmentCount = previousEnrollments.length;

  // Calculate trends
  const revenueChange = calculatePercentageChange(
    totalRevenue,
    previousRevenue
  );
  const enrollmentChange = calculatePercentageChange(
    totalEnrollments,
    previousEnrollmentCount
  );

  return {
    courseId,
    courseTitle: course.title,
    totalRevenue,
    totalEnrollments,
    averageRating: course.rating || 0,
    completionRate,
    trends: {
      revenueChange,
      enrollmentChange,
      ratingChange: 0, // Simplified: no historical rating data
    },
  };
}

/**
 * Calculate student engagement metrics for a course
 */
export async function getStudentEngagementMetrics(
  courseId: string
): Promise<StudentEngagementMetrics> {
  // Simulate async database query
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Get enrollments for this course
  const enrollments = MOCK_ENROLLMENTS.filter((e) => e.courseId === courseId);
  const totalStudents = enrollments.length;

  // Get test attempts for this course
  const testAttempts = MOCK_TEST_ATTEMPTS.filter(
    (t) => t.courseId === courseId
  );

  // Calculate active students (those with at least one test attempt)
  const studentsWithAttempts = new Set(testAttempts.map((t) => t.studentId));
  const activeStudents = studentsWithAttempts.size;

  // Calculate average test score
  const averageTestScore =
    testAttempts.length > 0
      ? testAttempts.reduce((sum, t) => sum + t.percentage, 0) /
        testAttempts.length
      : 0;

  // Calculate completion rate
  const completedEnrollments = enrollments.filter(
    (e) => e.status === "completed"
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
 * Calculate revenue analytics for a teacher
 */
export async function getRevenueAnalytics(
  teacherId: string,
  options: AnalyticsQueryOptions = {}
): Promise<RevenueMetrics> {
  const { timeRange = "30d" } = options;

  // Simulate async database query
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Get teacher's courses
  const teacherCourses = MOCK_COURSES.filter((c) => c.teacherId === teacherId);
  const courseIds = teacherCourses.map((c) => c.id);

  // Filter purchases by time range and teacher's courses
  const purchases = filterByTimeRange(
    MOCK_PURCHASES.filter((p) => courseIds.includes(p.courseId)),
    "purchasedAt",
    timeRange
  );

  // Calculate total revenue
  const totalRevenue = purchases.reduce((sum, p) => sum + p.amount, 0);

  // Calculate revenue by month
  const revenueByMonth: { month: string; revenue: number }[] = [];
  const monthlyRevenue = new Map<string, number>();

  purchases.forEach((purchase) => {
    const date = new Date(purchase.purchasedAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    monthlyRevenue.set(
      monthKey,
      (monthlyRevenue.get(monthKey) || 0) + purchase.amount
    );
  });

  // Sort by month and format
  const sortedMonths = Array.from(monthlyRevenue.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  sortedMonths.forEach(([month, revenue]) => {
    const [year, monthNum] = month.split("-");
    const monthName = new Date(
      parseInt(year),
      parseInt(monthNum) - 1
    ).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    revenueByMonth.push({ month: monthName, revenue });
  });

  // Calculate top courses by revenue
  const courseRevenue = new Map<string, number>();
  purchases.forEach((purchase) => {
    courseRevenue.set(
      purchase.courseId,
      (courseRevenue.get(purchase.courseId) || 0) + purchase.amount
    );
  });

  const topCourses = Array.from(courseRevenue.entries())
    .map(([courseId, revenue]) => {
      const course = teacherCourses.find((c) => c.id === courseId);
      return {
        courseId,
        courseTitle: course?.title || "Unknown Course",
        revenue,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Calculate previous period for trends
  const previousRange = getPreviousPeriodRange(timeRange);
  const previousPurchases = MOCK_PURCHASES.filter((p) => {
    if (!courseIds.includes(p.courseId)) return false;
    const date = new Date(p.purchasedAt);
    return date >= previousRange.start && date < previousRange.end;
  });

  const previousRevenue = previousPurchases.reduce(
    (sum, p) => sum + p.amount,
    0
  );
  const percentageChange = calculatePercentageChange(
    totalRevenue,
    previousRevenue
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
