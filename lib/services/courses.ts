/**
 * Course Service - CRUD operations for courses
 */

import { ID, Query } from "appwrite";
import { APPWRITE_CONFIG, databases } from "../appwrite";
import { typedListRows } from "../appwrite-helpers";
import { buildQueries, type QueryOptions } from "./helpers";
import type {
  CourseDocument,
  CreateCourseInput,
  EnrollmentDocument,
  PaginatedResponse,
  TestDocument,
  UpdateCourseInput,
} from "./types";

const { databaseId, tables } = APPWRITE_CONFIG;

/**
 * Get all published courses
 */
export async function getCourses(options: QueryOptions = {}): Promise<
  PaginatedResponse<
    CourseDocument & {
      enrollmentCount: number;
      testCount: number;
      rating?: number;
    }
  >
> {
  const queries = [Query.equal("isPublished", true), ...buildQueries(options)];

  const response = await typedListRows<CourseDocument>(
    tables.courses!,
    queries,
  );

  const documents = response.rows;

  if (documents.length === 0) {
    return { documents: [], total: 0, hasMore: false };
  }

  // Get course IDs
  const courseIds = documents.map((c) => c.$id);

  // Count enrollments and tests per course (independent queries — parallel)
  const [enrollmentResponse, testResponse] = await Promise.all([
    typedListRows<EnrollmentDocument>(tables.enrollments!, [
      Query.equal("courseId", courseIds),
      Query.limit(1000),
    ]),
    typedListRows<TestDocument>(tables.tests!, [
      Query.equal("courseId", courseIds),
      Query.limit(1000),
    ]),
  ]);

  // Build enrollment count map
  const enrollmentCountMap = new Map<string, number>();
  for (const enrollment of enrollmentResponse.rows) {
    enrollmentCountMap.set(
      enrollment.courseId,
      (enrollmentCountMap.get(enrollment.courseId) || 0) + 1,
    );
  }

  // Build test count map
  const testCountMap = new Map<string, number>();
  for (const test of testResponse.rows) {
    testCountMap.set(test.courseId, (testCountMap.get(test.courseId) || 0) + 1);
  }

  // Merge stats with courses
  const coursesWithStats = documents.map((course) => ({
    ...course,
    enrollmentCount: enrollmentCountMap.get(course.$id) || 0,
    testCount: testCountMap.get(course.$id) || 0,
    rating: 4.5, // Placeholder - would come from reviews
  }));

  return {
    documents: coursesWithStats,
    total: response.total,
    hasMore: response.total > (options.offset || 0) + documents.length,
  };
}

/**
 * Get a single course by ID
 */
export async function getCourseById(id: string): Promise<CourseDocument> {
  const response = await databases.getRow<CourseDocument>({
    databaseId: databaseId!,
    tableId: tables.courses!,
    rowId: id,
  });

  return response as CourseDocument;
}

/**
 * Get courses by teacher ID with computed stats (enrollment count, test count)
 */
export async function getCoursesByTeacher(
  teacherId: string,
  options: QueryOptions = {},
): Promise<
  PaginatedResponse<
    CourseDocument & {
      enrollmentCount: number;
      testCount: number;
      rating?: number;
    }
  >
> {
  const queries = [
    Query.equal("teacherId", teacherId),
    ...buildQueries(options),
  ];

  const response = await typedListRows<CourseDocument>(
    tables.courses!,
    queries,
  );

  const documents = response.rows;

  if (documents.length === 0) {
    return { documents: [], total: 0, hasMore: false };
  }

  // Get course IDs
  const courseIds = documents.map((c) => c.$id);

  // Count enrollments and tests per course (independent queries — parallel)
  const [enrollmentResponse, testResponse] = await Promise.all([
    typedListRows<EnrollmentDocument>(tables.enrollments!, [
      Query.equal("courseId", courseIds),
      Query.limit(1000),
    ]),
    typedListRows<TestDocument>(tables.tests!, [
      Query.equal("courseId", courseIds),
      Query.limit(1000),
    ]),
  ]);

  // Build enrollment count map
  const enrollmentCountMap = new Map<string, number>();
  for (const enrollment of enrollmentResponse.rows) {
    enrollmentCountMap.set(
      enrollment.courseId,
      (enrollmentCountMap.get(enrollment.courseId) || 0) + 1,
    );
  }

  // Build test count map
  const testCountMap = new Map<string, number>();
  for (const test of testResponse.rows) {
    testCountMap.set(test.courseId, (testCountMap.get(test.courseId) || 0) + 1);
  }

  // Merge stats with courses
  const coursesWithStats = documents.map((course) => ({
    ...course,
    enrollmentCount: enrollmentCountMap.get(course.$id) || 0,
    testCount: testCountMap.get(course.$id) || 0,
    rating: 4.5, // Placeholder - would come from reviews
  }));

  return {
    documents: coursesWithStats,
    total: response.total,
    hasMore: response.total > (options.offset || 0) + documents.length,
  };
}

/**
 * Get enrolled courses for a student
 * Returns courses where student has an active enrollment, with stats
 */
export async function getEnrolledCourses(
  studentId: string,
  options: QueryOptions = {},
): Promise<
  PaginatedResponse<
    CourseDocument & {
      enrollmentCount: number;
      testCount: number;
    }
  >
> {
  // First, get enrollments for this student
  const enrollmentResponse = await typedListRows<EnrollmentDocument>(
    tables.enrollments!,
    [
      Query.equal("studentId", studentId),
      Query.equal("status", "active"),
      Query.limit(100),
    ],
  );

  if (enrollmentResponse.rows.length === 0) {
    return { documents: [], total: 0, hasMore: false };
  }

  // Get course IDs from enrollments
  const courseIds = enrollmentResponse.rows.map((e) => e.courseId);

  // Fetch courses by IDs
  const queries = [Query.equal("$id", courseIds), ...buildQueries(options)];

  const response = await typedListRows<CourseDocument>(
    tables.courses!,
    queries,
  );

  const documents = response.rows;

  if (documents.length === 0) {
    return { documents: [], total: 0, hasMore: false };
  }

  // Count enrollments and tests per course (independent queries — parallel)
  const [allEnrollmentsResponse, testResponse] = await Promise.all([
    typedListRows<EnrollmentDocument>(tables.enrollments!, [
      Query.equal("courseId", courseIds),
      Query.limit(1000),
    ]),
    typedListRows<TestDocument>(tables.tests!, [
      Query.equal("courseId", courseIds),
      Query.equal("isPublished", true),
      Query.limit(1000),
    ]),
  ]);

  // Build enrollment count map
  const enrollmentCountMap = new Map<string, number>();
  for (const enrollment of allEnrollmentsResponse.rows) {
    enrollmentCountMap.set(
      enrollment.courseId,
      (enrollmentCountMap.get(enrollment.courseId) || 0) + 1,
    );
  }

  // Build test count map
  const testCountMap = new Map<string, number>();
  for (const test of testResponse.rows) {
    testCountMap.set(test.courseId, (testCountMap.get(test.courseId) || 0) + 1);
  }

  // Merge stats with courses
  const coursesWithStats = documents.map((course) => ({
    ...course,
    enrollmentCount: enrollmentCountMap.get(course.$id) || 0,
    testCount: testCountMap.get(course.$id) || 0,
  }));

  return {
    documents: coursesWithStats,
    total: response.total,
    hasMore: response.total > (options.offset || 0) + documents.length,
  };
}

/**
 * Create a new course
 */
export async function createCourse(
  data: CreateCourseInput,
  callingUserId: string,
): Promise<CourseDocument> {
  if (data.teacherId !== callingUserId) {
    throw new Error("Forbidden: You can only create courses as yourself");
  }

  const response = await databases.createRow<CourseDocument>({
    databaseId: databaseId!,
    tableId: tables.courses!,
    rowId: ID.unique(),
    data: {
      teacherId: data.teacherId,
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
      price: data.price,
      currency: data.currency || "INR",
      subjects: data.subjects,
      estimatedHours: data.estimatedHours,
      isPublished: data.isPublished ?? false,
    },
  });

  return response;
}

/**
 * Update an existing course
 */
export async function updateCourse(
  id: string,
  data: UpdateCourseInput,
  callingUserId: string,
): Promise<CourseDocument> {
  const course = await getCourseById(id);
  if (course.teacherId !== callingUserId) {
    throw new Error("Forbidden: You can only update your own courses");
  }

  const response = await databases.updateRow<CourseDocument>({
    databaseId: databaseId!,
    tableId: tables.courses!,
    rowId: id,
    data,
  });

  return response;
}

/**
 * Delete a course
 */
export async function deleteCourse(
  id: string,
  callingUserId: string,
): Promise<void> {
  const course = await getCourseById(id);
  if (course.teacherId !== callingUserId) {
    throw new Error("Forbidden: You can only delete your own courses");
  }

  await databases.deleteRow({
    databaseId: databaseId!,
    tableId: tables.courses!,
    rowId: id,
  });
}

/**
 * Get course with computed stats (enrollment count, test count)
 */
export async function getCourseWithStats(id: string): Promise<
  CourseDocument & {
    enrollmentCount: number;
    testCount: number;
    questionCount: number;
  }
> {
  // Fetch course
  const course = await getCourseById(id);

  // Count enrollments and tests (independent queries — parallel)
  const [enrollmentResponse, testResponse] = await Promise.all([
    databases.listRows({
      databaseId: databaseId!,
      tableId: tables.enrollments!,
      queries: [Query.equal("courseId", id), Query.limit(1)],
    }),
    databases.listRows({
      databaseId: databaseId!,
      tableId: tables.tests!,
      queries: [Query.equal("courseId", id), Query.limit(100)],
    }),
  ]);

  // Count questions for all tests
  let questionCount = 0;
  if (testResponse.rows.length > 0) {
    const testIds = testResponse.rows.map((t) => t.$id);
    const questionResponse = await databases.listRows({
      databaseId: databaseId!,
      tableId: tables.questions!,
      queries: [Query.equal("testId", testIds), Query.limit(1)],
    });
    questionCount = questionResponse.total;
  }

  return {
    ...course,
    enrollmentCount: enrollmentResponse.total,
    testCount: testResponse.total,
    questionCount,
  };
}
