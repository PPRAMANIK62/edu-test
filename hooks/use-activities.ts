/**
 * Activity Hooks
 *
 * TanStack Query hooks for activity operations.
 * Provides data fetching, caching, and mutations for user activities.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invalidateUserActivities, queryKeys } from "@/lib/query-keys";
import {
  getActivitiesByType,
  getActivitiesByUser,
  getActivityById,
  getActivityMetadata,
  getRecentActivitiesByUser,
  logAchievement,
  logActivity,
  logCourseStarted,
  logTestCompleted,
} from "@/lib/services/activities";
import type { QueryOptions } from "@/lib/services/helpers";
import type { CreateActivityInput } from "@/lib/services/types";

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch activities by user ID
 *
 * @param userId - The user's ID
 * @param options - Query options for pagination
 * @returns TanStack Query result with activities
 *
 * @example
 * ```tsx
 * const { data } = useActivitiesByUser('user-123');
 * ```
 */
export function useActivitiesByUser(
  userId: string | undefined,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.activities.byUser(userId!),
    queryFn: () => getActivitiesByUser(userId!, options),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // Shorter cache for activities
  });
}

/**
 * Fetch recent activities for a user
 *
 * @param userId - The user's ID
 * @param limit - Maximum number of activities to fetch
 * @returns TanStack Query result with recent activities
 *
 * @example
 * ```tsx
 * const { data: recentActivities } = useRecentActivities('user-123', 10);
 * ```
 */
export function useRecentActivities(
  userId: string | undefined,
  limit: number = 10,
) {
  return useQuery({
    queryKey: queryKeys.activities.recent(userId!, limit),
    queryFn: () => getRecentActivitiesByUser(userId!, limit),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Fetch a single activity by ID
 *
 * @param activityId - The activity ID
 * @returns TanStack Query result with activity document
 *
 * @example
 * ```tsx
 * const { data: activity } = useActivity('activity-123');
 * ```
 */
export function useActivity(activityId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.activities.detail(activityId!),
    queryFn: () => getActivityById(activityId!),
    enabled: !!activityId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch activities by type for a user
 *
 * @param userId - The user's ID
 * @param type - The activity type
 * @param options - Query options for pagination
 * @returns TanStack Query result with typed activities
 *
 * @example
 * ```tsx
 * const { data } = useActivitiesByType('user-123', 'test_completed');
 * ```
 */
export function useActivitiesByType(
  userId: string | undefined,
  type: "test_completed" | "course_started" | "achievement" | undefined,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.activities.byType(userId!, type!),
    queryFn: () => getActivitiesByType(userId!, type!, options),
    enabled: !!userId && !!type,
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Log a new activity
 *
 * @returns Mutation object for logging activities
 *
 * @example
 * ```tsx
 * const { mutate: log } = useLogActivity();
 * log({ userId: 'user-123', type: 'achievement', title: 'First Test', ... });
 * ```
 */
export function useLogActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateActivityInput) => logActivity(data),
    onSuccess: (_, { userId }) => {
      // Invalidate user's activities
      invalidateUserActivities(queryClient, userId);
    },
  });
}

/**
 * Log a test completed activity
 *
 * @returns Mutation object for logging test completion
 *
 * @example
 * ```tsx
 * const { mutate: logTest } = useLogTestCompleted();
 * logTest({ userId: 'user-123', testTitle: 'Math Quiz', score: 85, passed: true });
 * ```
 */
export function useLogTestCompleted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      testTitle,
      score,
      passed,
      testId,
      attemptId,
    }: {
      userId: string;
      testTitle: string;
      score: number;
      passed: boolean;
      testId?: string;
      attemptId?: string;
    }) => logTestCompleted(userId, testTitle, score, passed, testId, attemptId),
    onSuccess: (_, { userId }) => {
      invalidateUserActivities(queryClient, userId);
    },
  });
}

/**
 * Log a course started activity
 *
 * @returns Mutation object for logging course start
 *
 * @example
 * ```tsx
 * const { mutate: logCourse } = useLogCourseStarted();
 * logCourse({ userId: 'user-123', courseTitle: 'Advanced Math' });
 * ```
 */
export function useLogCourseStarted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      courseTitle,
      courseId,
    }: {
      userId: string;
      courseTitle: string;
      courseId?: string;
    }) => logCourseStarted(userId, courseTitle, courseId),
    onSuccess: (_, { userId }) => {
      invalidateUserActivities(queryClient, userId);
    },
  });
}

/**
 * Log an achievement activity
 *
 * @returns Mutation object for logging achievements
 *
 * @example
 * ```tsx
 * const { mutate: logAchieve } = useLogAchievement();
 * logAchieve({ userId: 'user-123', title: 'Perfect Score!', description: 'Got 100% on a test' });
 * ```
 */
export function useLogAchievement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      title,
      description,
      achievementType,
    }: {
      userId: string;
      title: string;
      description: string;
      achievementType?: string;
    }) => logAchievement(userId, title, description, achievementType),
    onSuccess: (_, { userId }) => {
      invalidateUserActivities(queryClient, userId);
    },
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse metadata from activity
 * This is a utility function, not a hook, but exported for convenience
 */
export { getActivityMetadata };
