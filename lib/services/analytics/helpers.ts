/**
 * Analytics Helpers
 *
 * Private helper functions used by analytics modules.
 */

import type { TimeRangeFilter } from "@/types";

/**
 * Get previous period date range for trend calculations
 */
export function getPreviousPeriodRange(timeRange: TimeRangeFilter): {
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
export function calculatePercentageChange(
  current: number,
  previous: number,
): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}
