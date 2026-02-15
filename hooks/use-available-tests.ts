import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Query } from "appwrite";

import { fetchAllRows } from "@/lib/appwrite-helpers";
import { APPWRITE_CONFIG } from "@/lib/appwrite";
import { getPublishedTestsByCourse } from "@/lib/services/tests";
import type { CourseDocument, TestAttemptDocument } from "@/lib/services/types";
import type { Test } from "@/types";

const { tables } = APPWRITE_CONFIG;

export function useAvailableTests(
  studentId: string | undefined,
  enrolledCourses: CourseDocument[] | undefined,
) {
  const courseIds = useMemo(
    () => enrolledCourses?.map((c) => c.$id) || [],
    [enrolledCourses],
  );

  return useQuery({
    queryKey: ["available-tests", studentId, courseIds],
    queryFn: async () => {
      if (!studentId || courseIds.length === 0 || !enrolledCourses) {
        return [];
      }

      const testsResults = await Promise.all(
        enrolledCourses.map((course) => getPublishedTestsByCourse(course.$id)),
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
      const attemptResponse = await fetchAllRows<TestAttemptDocument>(
        tables.testAttempts!,
        [Query.equal("studentId", studentId)],
      );

      const attemptCountMap = new Map<string, number>();
      for (const attempt of attemptResponse.rows) {
        attemptCountMap.set(
          attempt.testId,
          (attemptCountMap.get(attempt.testId) || 0) + 1,
        );
      }

      return allTests.map(
        ({ test, courseName }) =>
          ({
            id: test.$id,
            courseId: test.courseId,
            title: test.title,
            description: test.description,
            durationMinutes: test.durationMinutes,
            totalQuestions: 0,
            subjects: [],
            passingScore: test.passingScore,
            attemptCount: attemptCountMap.get(test.$id) || 0,
            isAvailable: test.isPublished,
            courseName,
          }) as Test & { courseName: string },
      );
    },
    enabled: !!studentId && courseIds.length > 0,
  });
}
