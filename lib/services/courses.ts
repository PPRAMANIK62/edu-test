/**
 * Course Service - CRUD operations for courses
 */

import { ID, Query } from "appwrite";
import { APPWRITE_CONFIG, databases } from "../appwrite";
import { buildQueries, type QueryOptions } from "./helpers";
import type {
  CourseDocument,
  CreateCourseInput,
  PaginatedResponse,
  UpdateCourseInput,
} from "./types";

const { databaseId, tables } = APPWRITE_CONFIG;

/**
 * Get all published courses
 */
export async function getCourses(
  options: QueryOptions = {}
): Promise<PaginatedResponse<CourseDocument>> {
  const queries = [Query.equal("isPublished", true), ...buildQueries(options)];

  const response = await databases.listRows<CourseDocument>(
    databaseId!,
    tables.courses!,
    queries
  );

  return {
    documents: response.rows as CourseDocument[],
    total: response.total,
    hasMore: response.total > (options.offset || 0) + response.rows.length,
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
 * Get courses by teacher ID
 */
export async function getCoursesByTeacher(
  teacherId: string,
  options: QueryOptions = {}
): Promise<PaginatedResponse<CourseDocument>> {
  const queries = [
    Query.equal("teacherId", teacherId),
    ...buildQueries(options),
  ];

  const response = await databases.listRows<CourseDocument>({
    databaseId: databaseId!,
    tableId: tables.courses!,
    queries,
  });

  return {
    documents: response.rows as CourseDocument[],
    total: response.total,
    hasMore: response.total > (options.offset || 0) + response.rows.length,
  };
}

/**
 * Get enrolled courses for a student
 * Returns courses where student has an active enrollment
 */
export async function getEnrolledCourses(
  studentId: string,
  options: QueryOptions = {}
): Promise<PaginatedResponse<CourseDocument>> {
  // First, get enrollments for this student
  const enrollmentResponse = await databases.listRows({
    databaseId: databaseId!,
    tableId: tables.enrollments!,
    queries: [
      Query.equal("studentId", studentId),
      Query.equal("status", "active"),
      Query.limit(100), // Get all enrollments
    ],
  });

  if (enrollmentResponse.rows.length === 0) {
    return { documents: [], total: 0, hasMore: false };
  }

  // Get course IDs from enrollments
  const courseIds = enrollmentResponse.rows.map(
    (e) => (e as unknown as { courseId: string }).courseId
  );

  // Fetch courses by IDs
  const queries = [Query.equal("$id", courseIds), ...buildQueries(options)];

  const response = await databases.listRows<CourseDocument>({
    databaseId: databaseId!,
    tableId: tables.courses!,
    queries,
  });

  return {
    documents: response.rows as CourseDocument[],
    total: response.total,
    hasMore: response.total > (options.offset || 0) + response.rows.length,
  };
}

/**
 * Create a new course
 */
export async function createCourse(
  data: CreateCourseInput
): Promise<CourseDocument> {
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
  data: UpdateCourseInput
): Promise<CourseDocument> {
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
export async function deleteCourse(id: string): Promise<void> {
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

  // Count enrollments
  const enrollmentResponse = await databases.listRows({
    databaseId: databaseId!,
    tableId: tables.enrollments!,
    queries: [Query.equal("courseId", id), Query.limit(1)],
  });

  // Count tests
  const testResponse = await databases.listRows({
    databaseId: databaseId!,
    tableId: tables.tests!,
    queries: [Query.equal("courseId", id), Query.limit(100)],
  });

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
