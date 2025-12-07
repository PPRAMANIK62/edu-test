/**
 * Activity Service
 * Handles activity logging and retrieval
 */

import { ID, Query } from "appwrite";
import { APPWRITE_CONFIG, databases } from "../appwrite";
import { buildQueries, parseJSON, type QueryOptions } from "./helpers";
import type {
  ActivityDocument,
  CreateActivityInput,
  PaginatedResponse,
} from "./types";

const { databaseId, tables } = APPWRITE_CONFIG;

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get activities by user ID
 */
export async function getActivitiesByUser(
  userId: string,
  options: QueryOptions = {}
): Promise<PaginatedResponse<ActivityDocument>> {
  const queries = [
    Query.equal("userId", userId),
    Query.orderDesc("$createdAt"),
    ...buildQueries(options),
  ];

  const response = await databases.listRows<ActivityDocument>({
    databaseId: databaseId!,
    tableId: tables.activities!,
    queries,
  });

  return {
    documents: response.rows,
    total: response.total,
    hasMore: response.total > (options.offset || 0) + response.rows.length,
  };
}

/**
 * Get recent activities with a limit (convenience function)
 */
export async function getRecentActivitiesByUser(
  userId: string,
  limit: number = 10
): Promise<ActivityDocument[]> {
  const result = await getActivitiesByUser(userId, { limit });
  return result.documents;
}

/**
 * Get activity by ID
 */
export async function getActivityById(
  activityId: string
): Promise<ActivityDocument | null> {
  try {
    const response = await databases.getRow<ActivityDocument>({
      databaseId: databaseId!,
      tableId: tables.activities!,
      rowId: activityId,
    });
    return response;
  } catch {
    return null;
  }
}

/**
 * Get activities by type for a user
 */
export async function getActivitiesByType(
  userId: string,
  type: "test_completed" | "course_started" | "achievement",
  options: QueryOptions = {}
): Promise<PaginatedResponse<ActivityDocument>> {
  const queries = [
    Query.equal("userId", userId),
    Query.equal("type", type),
    Query.orderDesc("$createdAt"),
    ...buildQueries(options),
  ];

  const response = await databases.listRows<ActivityDocument>({
    databaseId: databaseId!,
    tableId: tables.activities!,
    queries,
  });

  return {
    documents: response.rows,
    total: response.total,
    hasMore: response.total > (options.offset || 0) + response.rows.length,
  };
}

// ============================================================================
// Mutation Functions
// ============================================================================

/**
 * Create a new activity (log activity)
 */
export async function logActivity(
  input: CreateActivityInput
): Promise<ActivityDocument> {
  const response = await databases.createRow<ActivityDocument>({
    databaseId: databaseId!,
    tableId: tables.activities!,
    rowId: ID.unique(),
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      subtitle: input.subtitle,
      metadata: JSON.stringify(input.metadata || {}),
    },
  });

  return response;
}

/**
 * Log a test completed activity
 */
export async function logTestCompleted(
  userId: string,
  testTitle: string,
  score: number,
  passed: boolean,
  testId?: string,
  attemptId?: string
): Promise<ActivityDocument> {
  return logActivity({
    userId,
    type: "test_completed",
    title: `Completed: ${testTitle}`,
    subtitle: `Score: ${score}% - ${passed ? "Passed" : "Failed"}`,
    metadata: {
      testId,
      attemptId,
      score,
      passed,
    },
  });
}

/**
 * Log a course started activity
 */
export async function logCourseStarted(
  userId: string,
  courseTitle: string,
  courseId?: string
): Promise<ActivityDocument> {
  return logActivity({
    userId,
    type: "course_started",
    title: `Started: ${courseTitle}`,
    subtitle: "New course enrollment",
    metadata: {
      courseId,
    },
  });
}

/**
 * Log an achievement activity
 */
export async function logAchievement(
  userId: string,
  title: string,
  description: string,
  achievementType?: string
): Promise<ActivityDocument> {
  return logActivity({
    userId,
    type: "achievement",
    title,
    subtitle: description,
    metadata: {
      achievementType,
    },
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse metadata from activity
 */
export function getActivityMetadata<T = Record<string, unknown>>(
  activity: ActivityDocument
): T {
  return parseJSON<T>(activity.metadata, {} as T);
}

/**
 * Delete an activity
 */
export async function deleteActivity(activityId: string): Promise<void> {
  await databases.deleteRow({
    databaseId: databaseId!,
    tableId: tables.activities!,
    rowId: activityId,
  });
}

/**
 * Delete all activities for a user
 * Use with caution - primarily for account cleanup
 */
export async function deleteActivitiesByUser(userId: string): Promise<number> {
  let deleted = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await getActivitiesByUser(userId, { limit: 100 });

    for (const activity of result.documents) {
      await deleteActivity(activity.$id);
      deleted++;
    }

    hasMore = result.documents.length === 100;
  }

  return deleted;
}

// ============================================================================
// Analytics Functions
// ============================================================================

/**
 * Get activity count by type for a user
 */
export async function getActivityCountByType(
  userId: string
): Promise<Record<string, number>> {
  const types = ["test_completed", "course_started", "achievement"] as const;
  const counts: Record<string, number> = {};

  for (const type of types) {
    const result = await getActivitiesByType(userId, type, { limit: 1 });
    counts[type] = result.total;
  }

  return counts;
}
