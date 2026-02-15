/**
 * Helper utilities for Appwrite query building
 */

import { Query } from "appwrite";

/**
 * Query options for list operations
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderType?: "asc" | "desc";
}

/**
 * Default query limits
 */
export const DEFAULT_LIMIT = 25;
export const MAX_LIMIT = 100;

/**
 * Build query array from options
 */
export function buildQueries(options: QueryOptions = {}): string[] {
  const queries: string[] = [];

  const limit = Math.min(options.limit || DEFAULT_LIMIT, MAX_LIMIT);
  queries.push(Query.limit(limit));

  if (options.offset && options.offset > 0) {
    queries.push(Query.offset(options.offset));
  }

  if (options.orderBy) {
    if (options.orderType === "desc") {
      queries.push(Query.orderDesc(options.orderBy));
    } else {
      queries.push(Query.orderAsc(options.orderBy));
    }
  }

  return queries;
}

/**
 * Build date range query
 */
export function dateRangeQuery(
  field: string,
  start?: Date,
  end?: Date,
): string[] {
  const queries: string[] = [];

  if (start) {
    queries.push(Query.greaterThanEqual(field, start.toISOString()));
  }

  if (end) {
    queries.push(Query.lessThanEqual(field, end.toISOString()));
  }

  return queries;
}

/**
 * Get date range for time filter
 */
export function getDateRangeFromFilter(
  filter: "7d" | "30d" | "90d" | "1y" | "all",
): { start: Date | undefined; end: Date } {
  const end = new Date();
  let start: Date | undefined;

  switch (filter) {
    case "7d":
      start = new Date();
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start = new Date();
      start.setDate(start.getDate() - 30);
      break;
    case "90d":
      start = new Date();
      start.setDate(start.getDate() - 90);
      break;
    case "1y":
      start = new Date();
      start.setFullYear(start.getFullYear() - 1);
      break;
    case "all":
    default:
      start = undefined;
      break;
  }

  return { start, end };
}

/**
 * Parse JSON safely with fallback
 */
export function parseJSON<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Get current ISO timestamp
 */
export function nowISO(): string {
  return new Date().toISOString();
}
