export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderType?: "asc" | "desc";
}

export const DEFAULT_LIMIT = 25;
export const MAX_LIMIT = 100;

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

export function buildCountMap<T extends Record<string, unknown>>(
  items: T[],
  keyField: keyof T & string,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = String(item[keyField]);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

export function requireOwnership(
  resource: { teacher_id: string },
  callingUserId: string,
  action: string,
  resourceType: string,
): void {
  if (resource.teacher_id !== callingUserId) {
    throw new Error(
      `Forbidden: You can only ${action} your own ${resourceType}`,
    );
  }
}
