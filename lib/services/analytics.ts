/**
 * Analytics Service
 *
 * Database-driven analytics that calculate teacher metrics from Appwrite database.
 * Provides course performance, student engagement, and revenue analytics.
 */

import type {
  AnalyticsQueryOptions,
  CoursePerformanceMetrics,
  RevenueMetrics,
  StudentEngagementMetrics,
  TimeRangeFilter,
} from "@/types";
import { Query } from "appwrite";
import { APPWRITE_CONFIG, databases } from "../appwrite";
import { dateRangeQuery, getDateRangeFromFilter } from "./helpers";
import type {
  CourseDocument,
  EnrollmentDocument,
  PurchaseDocument,
  TestAttemptDocument,
  TestDocument,
} from "./types";

const { databaseId, tables } = APPWRITE_CONFIG;

// ============================================================================
// Helper Functions
// ============================================================================

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
 * Calculate percentage change between two values
 */
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

// ============================================================================
// Course Performance Analytics
// ============================================================================

/**
 * Calculate course performance metrics from database
 */
export async function getCoursePerformanceMetrics(
  courseId: string,
  options: AnalyticsQueryOptions = {}
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
    Query.limit(1000),
  ];

  const enrollmentResponse = await databases.listRows<EnrollmentDocument>({
    databaseId: databaseId!,
    tableId: tables.enrollments!,
    queries: enrollmentQueries,
  });

  const enrollments = enrollmentResponse.rows as EnrollmentDocument[];

  // Get purchases for this course in current period
  const purchaseQueries = [
    Query.equal("courseId", courseId),
    ...currentPurchaseDateQueries,
    Query.limit(1000),
  ];

  const purchaseResponse = await databases.listRows<PurchaseDocument>({
    databaseId: databaseId!,
    tableId: tables.purchases!,
    queries: purchaseQueries,
  });

  const purchases = purchaseResponse.rows as PurchaseDocument[];

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
    Query.limit(1000),
  ];

  const previousEnrollmentResponse =
    await databases.listRows<EnrollmentDocument>({
      databaseId: databaseId!,
      tableId: tables.enrollments!,
      queries: previousEnrollmentQueries,
    });

  const previousPurchaseQueries = [
    Query.equal("courseId", courseId),
    ...dateRangeQuery("purchasedAt", previousRange.start, previousRange.end),
    Query.limit(1000),
  ];

  const previousPurchaseResponse = await databases.listRows<PurchaseDocument>({
    databaseId: databaseId!,
    tableId: tables.purchases!,
    queries: previousPurchaseQueries,
  });

  const previousRevenue = (
    previousPurchaseResponse.rows as PurchaseDocument[]
  ).reduce((sum, p) => sum + p.amount, 0);
  const previousEnrollmentCount = previousEnrollmentResponse.total;

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
    averageRating: 0, // Rating system not implemented yet
    completionRate,
    trends: {
      revenueChange,
      enrollmentChange,
      ratingChange: 0, // No historical rating data
    },
  };
}

// ============================================================================
// Student Engagement Analytics
// ============================================================================

/**
 * Calculate student engagement metrics for a course
 */
export async function getStudentEngagementMetrics(
  courseId: string
): Promise<StudentEngagementMetrics> {
  // Get enrollments for this course
  const enrollmentResponse = await databases.listRows<EnrollmentDocument>({
    databaseId: databaseId!,
    tableId: tables.enrollments!,
    queries: [Query.equal("courseId", courseId), Query.limit(1000)],
  });

  const enrollments = enrollmentResponse.rows as EnrollmentDocument[];
  const totalStudents = enrollments.length;

  // Get test attempts for this course
  const attemptResponse = await databases.listRows<TestAttemptDocument>({
    databaseId: databaseId!,
    tableId: tables.testAttempts!,
    queries: [
      Query.equal("courseId", courseId),
      Query.equal("status", "completed"),
      Query.limit(1000),
    ],
  });

  const testAttempts = attemptResponse.rows as TestAttemptDocument[];

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

// ============================================================================
// Revenue Analytics
// ============================================================================

/**
 * Calculate revenue analytics for a teacher
 */
export async function getRevenueAnalytics(
  teacherId: string,
  options: AnalyticsQueryOptions = {}
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
    Query.limit(1000),
  ];

  const purchaseResponse = await databases.listRows<PurchaseDocument>({
    databaseId: databaseId!,
    tableId: tables.purchases!,
    queries: purchaseQueries,
  });

  const purchases = purchaseResponse.rows as PurchaseDocument[];

  // Calculate total revenue
  const totalRevenue = purchases.reduce((sum, p) => sum + p.amount, 0);

  // Calculate revenue by month
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

  const revenueByMonth = sortedMonths.map(([month, revenue]) => {
    const [year, monthNum] = month.split("-");
    const monthName = new Date(
      parseInt(year),
      parseInt(monthNum) - 1
    ).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    return { month: monthName, revenue };
  });

  // Calculate top courses by revenue
  const courseRevenue = new Map<string, number>();
  purchases.forEach((purchase) => {
    courseRevenue.set(
      purchase.courseId,
      (courseRevenue.get(purchase.courseId) || 0) + purchase.amount
    );
  });

  // Get top 5 courses by revenue
  const topCourseIds = Array.from(courseRevenue.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([courseId]) => courseId);

  // Fetch enrollment counts for top courses
  const enrollmentCountsMap = new Map<string, number>();
  if (topCourseIds.length > 0) {
    const enrollmentResponse = await databases.listRows<EnrollmentDocument>({
      databaseId: databaseId!,
      tableId: tables.enrollments!,
      queries: [Query.equal("courseId", topCourseIds), Query.limit(1000)],
    });

    // Count enrollments per course
    (enrollmentResponse.rows as EnrollmentDocument[]).forEach((enrollment) => {
      enrollmentCountsMap.set(
        enrollment.courseId,
        (enrollmentCountsMap.get(enrollment.courseId) || 0) + 1
      );
    });
  }

  // Fetch test counts for top courses
  const testCountsMap = new Map<string, number>();
  if (topCourseIds.length > 0) {
    const testResponse = await databases.listRows<TestDocument>({
      databaseId: databaseId!,
      tableId: tables.tests!,
      queries: [Query.equal("courseId", topCourseIds), Query.limit(1000)],
    });

    // Count tests per course
    (testResponse.rows as TestDocument[]).forEach((test) => {
      testCountsMap.set(
        test.courseId,
        (testCountsMap.get(test.courseId) || 0) + 1
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
    Query.limit(1000),
  ];

  const previousPurchaseResponse = await databases.listRows<PurchaseDocument>({
    databaseId: databaseId!,
    tableId: tables.purchases!,
    queries: previousPurchaseQueries,
  });

  const previousRevenue = (
    previousPurchaseResponse.rows as PurchaseDocument[]
  ).reduce((sum, p) => sum + p.amount, 0);
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

// ============================================================================
// Teacher Dashboard Stats
// ============================================================================

/**
 * Get aggregated stats for teacher dashboard
 */
export async function getTeacherDashboardStats(teacherId: string): Promise<{
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageCompletionRate: number;
}> {
  // Get teacher's courses
  const courseResponse = await databases.listRows<CourseDocument>({
    databaseId: databaseId!,
    tableId: tables.courses!,
    queries: [Query.equal("teacherId", teacherId), Query.limit(100)],
  });

  const courses = courseResponse.rows as CourseDocument[];
  const courseIds = courses.map((c) => c.$id);
  const totalCourses = courses.length;

  if (courseIds.length === 0) {
    return {
      totalCourses: 0,
      totalStudents: 0,
      totalRevenue: 0,
      averageCompletionRate: 0,
    };
  }

  // Get all enrollments for teacher's courses
  const enrollmentResponse = await databases.listRows<EnrollmentDocument>({
    databaseId: databaseId!,
    tableId: tables.enrollments!,
    queries: [Query.equal("courseId", courseIds), Query.limit(1000)],
  });

  const enrollments = enrollmentResponse.rows as EnrollmentDocument[];

  // Count unique students
  const uniqueStudents = new Set(enrollments.map((e) => e.studentId));
  const totalStudents = uniqueStudents.size;

  // Calculate completion rate
  const completedEnrollments = enrollments.filter(
    (e) => e.status === "completed"
  );
  const averageCompletionRate =
    enrollments.length > 0
      ? (completedEnrollments.length / enrollments.length) * 100
      : 0;

  // Get total revenue
  const purchaseResponse = await databases.listRows<PurchaseDocument>({
    databaseId: databaseId!,
    tableId: tables.purchases!,
    queries: [Query.equal("courseId", courseIds), Query.limit(1000)],
  });

  const totalRevenue = (purchaseResponse.rows as PurchaseDocument[]).reduce(
    (sum, p) => sum + p.amount,
    0
  );

  return {
    totalCourses,
    totalStudents,
    totalRevenue,
    averageCompletionRate,
  };
}

// ============================================================================
// Course Analytics Summary
// ============================================================================

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
  // Get enrollments
  const enrollmentResponse = await databases.listRows<EnrollmentDocument>({
    databaseId: databaseId!,
    tableId: tables.enrollments!,
    queries: [Query.equal("courseId", courseId), Query.limit(1000)],
  });

  const enrollments = enrollmentResponse.rows as EnrollmentDocument[];
  const enrollmentCount = enrollments.length;
  const completedCount = enrollments.filter(
    (e) => e.status === "completed"
  ).length;

  // Get purchases
  const purchaseResponse = await databases.listRows<PurchaseDocument>({
    databaseId: databaseId!,
    tableId: tables.purchases!,
    queries: [Query.equal("courseId", courseId), Query.limit(1000)],
  });

  const totalRevenue = (purchaseResponse.rows as PurchaseDocument[]).reduce(
    (sum, p) => sum + p.amount,
    0
  );

  // Get test attempts
  const attemptResponse = await databases.listRows<TestAttemptDocument>({
    databaseId: databaseId!,
    tableId: tables.testAttempts!,
    queries: [
      Query.equal("courseId", courseId),
      Query.equal("status", "completed"),
      Query.limit(1000),
    ],
  });

  const attempts = attemptResponse.rows as TestAttemptDocument[];
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

// ============================================================================
// Student Stats for Teacher Dashboard
// ============================================================================

/**
 * Get detailed stats for a specific student
 */
export async function getStudentStats(studentId: string): Promise<{
  enrolledCourses: number;
  completedTests: number;
  averageScore: number;
  totalSpent: number;
}> {
  // Get enrollment count
  const enrollmentResponse = await databases.listRows<EnrollmentDocument>({
    databaseId: databaseId!,
    tableId: tables.enrollments!,
    queries: [Query.equal("studentId", studentId), Query.limit(1000)],
  });

  const enrolledCourses = enrollmentResponse.total;

  // Get completed test attempts
  const attemptResponse = await databases.listRows<TestAttemptDocument>({
    databaseId: databaseId!,
    tableId: tables.testAttempts!,
    queries: [
      Query.equal("studentId", studentId),
      Query.equal("status", "completed"),
      Query.limit(1000),
    ],
  });

  const attempts = attemptResponse.rows as TestAttemptDocument[];
  const completedTests = attempts.length;
  const averageScore =
    attempts.length > 0
      ? attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) /
        attempts.length
      : 0;

  // Get total spent
  const purchaseResponse = await databases.listRows<PurchaseDocument>({
    databaseId: databaseId!,
    tableId: tables.purchases!,
    queries: [Query.equal("studentId", studentId), Query.limit(1000)],
  });

  const totalSpent = (purchaseResponse.rows as PurchaseDocument[]).reduce(
    (sum, p) => sum + p.amount,
    0
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

  // Get all enrollments for these students
  const enrollmentResponse = await databases.listRows<EnrollmentDocument>({
    databaseId: databaseId!,
    tableId: tables.enrollments!,
    queries: [Query.equal("studentId", studentIds), Query.limit(1000)],
  });

  // Get all completed attempts for these students
  const attemptResponse = await databases.listRows<TestAttemptDocument>({
    databaseId: databaseId!,
    tableId: tables.testAttempts!,
    queries: [
      Query.equal("studentId", studentIds),
      Query.equal("status", "completed"),
      Query.limit(1000),
    ],
  });

  // Get all purchases for these students
  const purchaseResponse = await databases.listRows<PurchaseDocument>({
    databaseId: databaseId!,
    tableId: tables.purchases!,
    queries: [Query.equal("studentId", studentIds), Query.limit(1000)],
  });

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
  (enrollmentResponse.rows as EnrollmentDocument[]).forEach((enrollment) => {
    const stats = statsMap.get(enrollment.studentId);
    if (stats) {
      stats.enrolledCourses += 1;
    }
  });

  // Count attempts and scores
  (attemptResponse.rows as TestAttemptDocument[]).forEach((attempt) => {
    const stats = statsMap.get(attempt.studentId);
    if (stats) {
      stats.completedTests += 1;
      stats.totalScore += attempt.percentage || 0;
      stats.attemptCount += 1;
    }
  });

  // Sum purchases
  (purchaseResponse.rows as PurchaseDocument[]).forEach((purchase) => {
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
 * Get average completion rate across all students for a teacher's courses
 */
export async function getAverageCompletionRate(
  courseIds: string[]
): Promise<number> {
  if (courseIds.length === 0) return 0;

  const enrollmentResponse = await databases.listRows<EnrollmentDocument>({
    databaseId: databaseId!,
    tableId: tables.enrollments!,
    queries: [Query.equal("courseId", courseIds), Query.limit(1000)],
  });

  const enrollments = enrollmentResponse.rows as EnrollmentDocument[];
  if (enrollments.length === 0) return 0;

  const completedCount = enrollments.filter(
    (e) => e.status === "completed"
  ).length;
  return (completedCount / enrollments.length) * 100;
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

  // Get enrollments for all courses
  const enrollmentResponse = await databases.listRows<EnrollmentDocument>({
    databaseId: databaseId!,
    tableId: tables.enrollments!,
    queries: [Query.equal("courseId", courseIds), Query.limit(1000)],
  });

  // Get purchases for all courses
  const purchaseResponse = await databases.listRows<PurchaseDocument>({
    databaseId: databaseId!,
    tableId: tables.purchases!,
    queries: [Query.equal("courseId", courseIds), Query.limit(1000)],
  });

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
  (enrollmentResponse.rows as EnrollmentDocument[]).forEach((enrollment) => {
    const stats = result.get(enrollment.courseId);
    if (stats) {
      stats.enrollmentCount += 1;
      if (new Date(enrollment.enrolledAt) >= thirtyDaysAgo) {
        stats.recentEnrollments += 1;
      }
    }
  });

  // Sum revenue
  (purchaseResponse.rows as PurchaseDocument[]).forEach((purchase) => {
    const stats = result.get(purchase.courseId);
    if (stats) {
      stats.revenue += purchase.amount;
    }
  });

  return result;
}

/**
 * Get enriched enrollment data with student and course names
 */
export async function getEnrichedRecentEnrollments(limit: number = 10): Promise<
  {
    id: string;
    studentId: string;
    studentName: string;
    courseId: string;
    courseTitle: string;
    enrolledAt: string;
    status: "active" | "completed";
  }[]
> {
  // Get recent enrollments
  const enrollmentResponse = await databases.listRows<EnrollmentDocument>({
    databaseId: databaseId!,
    tableId: tables.enrollments!,
    queries: [Query.orderDesc("enrolledAt"), Query.limit(limit)],
  });

  const enrollments = enrollmentResponse.rows as EnrollmentDocument[];

  if (enrollments.length === 0) {
    return [];
  }

  // Get unique student and course IDs
  const studentIds = [...new Set(enrollments.map((e) => e.studentId))];
  const courseIds = [...new Set(enrollments.map((e) => e.courseId))];

  // Fetch students
  const studentResponse = await databases.listRows({
    databaseId: databaseId!,
    tableId: tables.users!,
    queries: [Query.equal("$id", studentIds), Query.limit(100)],
  });

  const studentMap = new Map<string, string>();
  (
    studentResponse.rows as unknown as {
      $id: string;
      firstName: string;
      lastName: string;
    }[]
  ).forEach((s) => {
    studentMap.set(s.$id, `${s.firstName} ${s.lastName}`);
  });

  // Fetch courses
  const courseResponse = await databases.listRows<CourseDocument>({
    databaseId: databaseId!,
    tableId: tables.courses!,
    queries: [Query.equal("$id", courseIds), Query.limit(100)],
  });

  const courseMap = new Map<string, string>();
  (courseResponse.rows as CourseDocument[]).forEach((c) => {
    courseMap.set(c.$id, c.title);
  });

  // Build enriched results
  return enrollments.map((enrollment) => ({
    id: enrollment.$id,
    studentId: enrollment.studentId,
    studentName: studentMap.get(enrollment.studentId) || "Unknown Student",
    courseId: enrollment.courseId,
    courseTitle: courseMap.get(enrollment.courseId) || "Unknown Course",
    enrolledAt: enrollment.enrolledAt,
    status: enrollment.status as "active" | "completed",
  }));
}

/**
 * Get attempt count for a specific test by student
 */
export async function getTestAttemptCount(
  studentId: string,
  testId: string
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
