import { supabase } from "../supabase";
import { DEFAULT_LIMIT, MAX_LIMIT, type QueryOptions } from "./helpers";
import type {
  ActivityRow,
  CreateActivityInput,
  PaginatedResponse,
} from "./types";

export async function getActivitiesByUser(
  user_id: string,
  options: QueryOptions = {},
): Promise<PaginatedResponse<ActivityRow>> {
  const limit = Math.min(options.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = options.offset || 0;

  const { data, error, count } = await supabase
    .from("activities")
    .select("*", { count: "exact" })
    .eq("user_id", user_id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const rows = (data ?? []) as ActivityRow[];
  return {
    documents: rows,
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + rows.length,
  };
}

export async function getRecentActivitiesByUser(
  user_id: string,
  limit: number = 10,
): Promise<ActivityRow[]> {
  const result = await getActivitiesByUser(user_id, { limit });
  return result.documents;
}

export async function getActivityById(
  activityId: string,
): Promise<ActivityRow | null> {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("id", activityId)
    .maybeSingle();

  if (error) return null;
  return data as ActivityRow | null;
}

export async function getActivitiesByType(
  user_id: string,
  type: "test_completed" | "course_started" | "achievement",
  options: QueryOptions = {},
): Promise<PaginatedResponse<ActivityRow>> {
  const limit = Math.min(options.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = options.offset || 0;

  const { data, error, count } = await supabase
    .from("activities")
    .select("*", { count: "exact" })
    .eq("user_id", user_id)
    .eq("type", type)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const rows = (data ?? []) as ActivityRow[];
  return {
    documents: rows,
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + rows.length,
  };
}

// metadata is jsonb — written directly, no JSON.stringify needed
export async function logActivity(
  input: CreateActivityInput,
): Promise<ActivityRow> {
  const { data, error } = await supabase
    .from("activities")
    .insert({
      user_id: input.user_id,
      type: input.type,
      title: input.title,
      subtitle: input.subtitle,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) throw error;
  return data as ActivityRow;
}

export async function logTestCompleted(
  user_id: string,
  testTitle: string,
  score: number,
  passed: boolean,
  test_id?: string,
  attempt_id?: string,
): Promise<ActivityRow> {
  return logActivity({
    user_id,
    type: "test_completed",
    title: `Completed: ${testTitle}`,
    subtitle: `Score: ${score}% - ${passed ? "Passed" : "Failed"}`,
    metadata: { test_id, attempt_id, score, passed },
  });
}

export async function logCourseStarted(
  user_id: string,
  courseTitle: string,
  course_id?: string,
): Promise<ActivityRow> {
  return logActivity({
    user_id,
    type: "course_started",
    title: `Started: ${courseTitle}`,
    subtitle: "New course enrollment",
    metadata: { course_id },
  });
}

export async function logAchievement(
  user_id: string,
  title: string,
  description: string,
  achievementType?: string,
): Promise<ActivityRow> {
  return logActivity({
    user_id,
    type: "achievement",
    title,
    subtitle: description,
    metadata: { achievementType },
  });
}

// metadata is jsonb — already parsed, no JSON.parse needed
export function getActivityMetadata<T = Record<string, unknown>>(
  activity: ActivityRow,
): T {
  return (activity.metadata ?? {}) as T;
}

export async function deleteActivity(activityId: string): Promise<void> {
  const { error } = await supabase
    .from("activities")
    .delete()
    .eq("id", activityId);
  if (error) throw error;
}

export async function deleteActivitiesByUser(user_id: string): Promise<number> {
  let deleted = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await getActivitiesByUser(user_id, { limit: 100 });

    for (const activity of result.documents) {
      await deleteActivity(activity.id);
      deleted++;
    }

    hasMore = result.documents.length === 100;
  }

  return deleted;
}

export async function getActivityCountByType(
  user_id: string,
): Promise<Record<string, number>> {
  const types = ["test_completed", "course_started", "achievement"] as const;
  const counts: Record<string, number> = {};

  for (const type of types) {
    const result = await getActivitiesByType(user_id, type, { limit: 1 });
    counts[type] = result.total;
  }

  return counts;
}
