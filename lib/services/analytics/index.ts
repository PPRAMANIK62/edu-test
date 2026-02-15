/**
 * Analytics Service — Barrel Export
 *
 * Re-exports all analytics functions from their focused modules.
 * All imports from `@/lib/services/analytics` continue to work unchanged.
 */

export {
  getCoursePerformanceMetrics,
  getCourseAnalyticsSummary,
  getCoursePerformanceData,
} from "./course-performance";
export {
  getStudentEngagementMetrics,
  getAverageCompletionRate,
} from "./engagement";
export { getRevenueAnalytics } from "./revenue";
export {
  getStudentStats,
  getStudentsWithStats,
  getTestAttemptCount,
} from "./students";
export {
  getTeacherDashboardStats,
  getEnrichedRecentEnrollments,
} from "./dashboard";
