import { supabase } from "./supabase";

// ============================================================================
// Table name constants
// ============================================================================

export const TABLES = {
  profiles: "profiles",
  courses: "courses",
  tests: "tests",
  test_subjects: "test_subjects",
  questions: "questions",
  enrollments: "enrollments",
  purchases: "purchases",
  test_attempts: "test_attempts",
  activities: "activities",
} as const;

// ============================================================================
// Batch fetch helper
// ============================================================================

/**
 * Fetch all rows from a table with automatic pagination.
 * Use when you need every row (analytics, batch operations).
 * For normal paginated queries, use supabase.from() directly in services.
 */
export async function fetchAllRows<T>(
  table: string,
  buildQuery: (query: any) => any = (q) => q,
  batchSize = 1000,
): Promise<T[]> {
  const allRows: T[] = [];
  let offset = 0;

  while (true) {
    let query = supabase
      .from(table)
      .select("*")
      .range(offset, offset + batchSize - 1);

    query = buildQuery(query);
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;

    allRows.push(...(data as T[]));
    if (data.length < batchSize) break;
    offset += batchSize;
  }

  return allRows;
}

/**
 * Count rows in a table with optional filters.
 * Uses Supabase's head:true + count for efficiency (no row data transferred).
 */
export async function countRows(
  table: string,
  buildQuery: (query: any) => any = (q) => q,
): Promise<number> {
  let query = supabase.from(table).select("*", { count: "exact", head: true });

  query = buildQuery(query);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}
