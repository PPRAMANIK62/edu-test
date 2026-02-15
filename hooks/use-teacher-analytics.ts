/**
 * Teacher Analytics Hooks
 *
 * TanStack Query hooks for fetching and caching teacher analytics metrics.
 * Provides automatic loading states, error handling, and cache management.
 */

import { STALE_TIMES, queryKeys } from "@/lib/query-keys";
import {
  getCoursePerformanceMetrics,
  getRevenueAnalytics,
  getStudentEngagementMetrics,
} from "@/lib/services/analytics";
import type { TimeRangeFilter } from "@/types";
import { useQuery } from "@tanstack/react-query";

/**
 * Fetch course performance metrics with caching
 *
 * @param courseId - The ID of the course to analyze
 * @param timeRange - Time period for the analysis (default: 30d)
 * @returns TanStack Query result with CoursePerformanceMetrics
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useCoursePerformance('course-1', '30d');
 * if (data) {
 *   console.log(`Revenue: $${data.totalRevenue}`);
 *   console.log(`Trend: ${data.trends.revenueChange}%`);
 * }
 * ```
 */
export function useCoursePerformance(
  courseId: string,
  timeRange: TimeRangeFilter = "30d",
) {
  return useQuery({
    queryKey: queryKeys.analytics.coursePerformance(courseId, timeRange),
    queryFn: () => getCoursePerformanceMetrics(courseId, { timeRange }),
    staleTime: STALE_TIMES.STATIC,
    enabled: !!courseId, // Only run if courseId is provided
  });
}

/**
 * Fetch student engagement metrics for a course
 *
 * @param courseId - The ID of the course to analyze
 * @returns TanStack Query result with StudentEngagementMetrics
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useStudentEngagement('course-1');
 * if (data) {
 *   console.log(`Active students: ${data.activeStudents}`);
 *   console.log(`Average score: ${data.averageTestScore}%`);
 * }
 * ```
 */
export function useStudentEngagement(courseId: string) {
  return useQuery({
    queryKey: queryKeys.analytics.studentEngagement(courseId),
    queryFn: () => getStudentEngagementMetrics(courseId),
    staleTime: STALE_TIMES.STATIC,
    enabled: !!courseId,
  });
}

/**
 * Fetch revenue analytics for a teacher
 *
 * @param teacherId - The ID of the teacher
 * @param timeRange - Time period for the analysis (default: 30d)
 * @returns TanStack Query result with RevenueMetrics
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useRevenueAnalytics('teacher-1', '90d');
 * if (data) {
 *   console.log(`Total revenue: $${data.totalRevenue}`);
 *   console.log(`Change: ${data.trends.percentageChange}%`);
 * }
 * ```
 */
export function useRevenueAnalytics(
  teacherId: string,
  timeRange: TimeRangeFilter = "30d",
) {
  return useQuery({
    queryKey: queryKeys.analytics.revenueAnalytics(teacherId, timeRange),
    queryFn: () => getRevenueAnalytics(teacherId, { timeRange }),
    staleTime: STALE_TIMES.STATIC,
    enabled: !!teacherId,
  });
}
