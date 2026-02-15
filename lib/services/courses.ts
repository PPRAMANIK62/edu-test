/**
 * Course Service - CRUD operations for courses
 */

import { ID, Query } from "appwrite";
import { APPWRITE_CONFIG, databases } from "../appwrite";
import { fetchAllRows, typedListRows } from "../appwrite-helpers";
import { createCourseInputSchema, updateCourseInputSchema } from "../schemas";
import {
  buildCountMap,
  buildQueries,
  requireOwnership,
  type QueryOptions,
} from "./helpers";
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
 * Enrich courses with enrollment and test count stats.
 * Fetches all enrollments and tests for the given courses in parallel,
 * then builds count maps and merges with course data.
 *
 * @param extraTestQueries - Additional queries to filter tests (e.g. isPublished for student views)
 */
async function enrichCoursesWithStats(
  courses: CourseDocument[],
  extraTestQueries: string[] = [],
): Promise<
  (CourseDocument & { enrollmentCount: number; testCount: number })[]
> {
  if (courses.length === 0) return [];

  const courseIds = courses.map((c) => c.$id);

  const [enrollmentResponse, testResponse] = await Promise.all([
    fetchAllRows<EnrollmentDocument>(tables.enrollments!, [
      Query.equal("courseId", courseIds),
    ]),
    fetchAllRows<TestDocument>(tables.tests!, [
      Query.equal("courseId", courseIds),
      ...extraTestQueries,
    ]),
  ]);

  const enrollmentCountMap = buildCountMap(
    enrollmentResponse.rows as unknown as Record<string, unknown>[],
    "courseId",
  );
  const testCountMap = buildCountMap(
    testResponse.rows as unknown as Record<string, unknown>[],
    "courseId",
  );

  return courses.map((course) => ({
    ...course,
    enrollmentCount: enrollmentCountMap.get(course.$id) || 0,
    testCount: testCountMap.get(course.$id) || 0,
  }));
}

/**
 * Get all published courses
 */
export async function getCourses(options: QueryOptions = {}): Promise<
  PaginatedResponse<
    CourseDocument & {
      enrollmentCount: number;
      testCount: number;
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

  const coursesWithStats = await enrichCoursesWithStats(documents);

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

  const coursesWithStats = await enrichCoursesWithStats(documents);

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

  const coursesWithStats = await enrichCoursesWithStats(documents, [
    Query.equal("isPublished", true),
  ]);

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
  createCourseInputSchema.parse(data);
  requireOwnership(
    { teacherId: data.teacherId },
    callingUserId,
    "create",
    "courses",
  );

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
  updateCourseInputSchema.parse(data);
  const course = await getCourseById(id);
  requireOwnership(course, callingUserId, "update", "courses");

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
  requireOwnership(course, callingUserId, "delete", "courses");

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
