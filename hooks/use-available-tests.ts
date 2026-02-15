import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { fetchAllRows } from "@/lib/supabase-helpers";
import { getPublishedTestsByCourse } from "@/lib/services/tests";
import type { CourseRow, TestAttemptRow } from "@/lib/services/types";
import type { Test } from "@/types";

export function useAvailableTests(
  studentId: string | undefined,
  enrolledCourses: CourseRow[] | undefined,
) {
  const courseIds = useMemo(
    () => enrolledCourses?.map((c) => c.id) || [],
    [enrolledCourses],
  );

  return useQuery({
    queryKey: ["available-tests", studentId, courseIds],
    queryFn: async () => {
      if (!studentId || courseIds.length === 0 || !enrolledCourses) {
        return [];
      }

      const testsResults = await Promise.all(
        enrolledCourses.map((course) => getPublishedTestsByCourse(course.id)),
      );

      const allTests = testsResults.flatMap((result, index) =>
        result.documents.map((test) => ({
          test,
          courseName: enrolledCourses[index].title,
        })),
      );

      if (allTests.length === 0) {
        return [];
      }

      // N+1 fix: single bulk fetch of all student attempts instead of per-test queries
      const attempts = await fetchAllRows<TestAttemptRow>(
        "test_attempts",
        (q) => q.eq("student_id", studentId),
      );

      const attemptCountMap = new Map<string, number>();
      for (const attempt of attempts) {
        attemptCountMap.set(
          attempt.test_id,
          (attemptCountMap.get(attempt.test_id) || 0) + 1,
        );
      }

      return allTests.map(
        ({ test, courseName }) =>
          ({
            id: test.id,
            course_id: test.course_id,
            title: test.title,
            description: test.description,
            duration_minutes: test.duration_minutes,
            total_questions: 0,
            subjects: [],
            passing_score: test.passing_score,
            attempt_count: attemptCountMap.get(test.id) || 0,
            is_available: test.is_published,
            courseName,
          }) as Test & { courseName: string },
      );
    },
    enabled: !!studentId && courseIds.length > 0,
  });
}
