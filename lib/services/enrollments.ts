/**
 * Enrollment Service - Student enrollment management
 */

import { ID, Query } from "appwrite";
import { APPWRITE_CONFIG, databases } from "../appwrite";
import { createEnrollmentInputSchema } from "../schemas";
import { buildQueries, nowISO, type QueryOptions } from "./helpers";
import type {
  CreateEnrollmentInput,
  EnrollmentDocument,
  PaginatedResponse,
} from "./types";

const { databaseId, tables } = APPWRITE_CONFIG;

/**
 * Get enrollments for a student
 */
export async function getEnrollmentsByStudent(
  studentId: string,
  options: QueryOptions = {},
): Promise<PaginatedResponse<EnrollmentDocument>> {
  const queries = [
    Query.equal("studentId", studentId),
    ...buildQueries({
      ...options,
      orderBy: options.orderBy || "enrolledAt",
      orderType: "desc",
    }),
  ];

  const response = await databases.listRows<EnrollmentDocument>({
    databaseId: databaseId!,
    tableId: tables.enrollments!,
    queries,
  });

  return {
    documents: response.rows as EnrollmentDocument[],
    total: response.total,
    hasMore: response.total > (options.offset || 0) + response.rows.length,
  };
}

/**
 * Get active enrollments for a student
 */
export async function getActiveEnrollmentsByStudent(
  studentId: string,
  options: QueryOptions = {},
): Promise<PaginatedResponse<EnrollmentDocument>> {
  const queries = [
    Query.equal("studentId", studentId),
    Query.equal("status", "active"),
    ...buildQueries({
      ...options,
      orderBy: options.orderBy || "enrolledAt",
      orderType: "desc",
    }),
  ];

  const response = await databases.listRows<EnrollmentDocument>({
    databaseId: databaseId!,
    tableId: tables.enrollments!,
    queries,
  });

  return {
    documents: response.rows as EnrollmentDocument[],
    total: response.total,
    hasMore: response.total > (options.offset || 0) + response.rows.length,
  };
}

/**
 * Get enrollments for a course
 */
export async function getEnrollmentsByCourse(
  courseId: string,
  options: QueryOptions = {},
): Promise<PaginatedResponse<EnrollmentDocument>> {
  const queries = [
    Query.equal("courseId", courseId),
    ...buildQueries({
      ...options,
      orderBy: options.orderBy || "enrolledAt",
      orderType: "desc",
    }),
  ];

  const response = await databases.listRows<EnrollmentDocument>({
    databaseId: databaseId!,
    tableId: tables.enrollments!,
    queries,
  });

  return {
    documents: response.rows as EnrollmentDocument[],
    total: response.total,
    hasMore: response.total > (options.offset || 0) + response.rows.length,
  };
}

/**
 * Get a specific enrollment
 */
export async function getEnrollmentById(
  id: string,
): Promise<EnrollmentDocument> {
  const response = await databases.getRow<EnrollmentDocument>({
    databaseId: databaseId!,
    tableId: tables.enrollments!,
    rowId: id,
  });

  return response as EnrollmentDocument;
}

/**
 * Check if a student is enrolled in a course
 */
export async function isStudentEnrolled(
  studentId: string,
  courseId: string,
): Promise<boolean> {
  const response = await databases.listRows({
    databaseId: databaseId!,
    tableId: tables.enrollments!,
    queries: [
      Query.equal("studentId", studentId),
      Query.equal("courseId", courseId),
      Query.limit(1),
    ],
  });

  return response.rows.length > 0;
}

/**
 * Get enrollment for a student in a specific course
 */
export async function getEnrollment(
  studentId: string,
  courseId: string,
): Promise<EnrollmentDocument | null> {
  const response = await databases.listRows<EnrollmentDocument>({
    databaseId: databaseId!,
    tableId: tables.enrollments!,
    queries: [
      Query.equal("studentId", studentId),
      Query.equal("courseId", courseId),
      Query.limit(1),
    ],
  });

  return response.rows.length > 0
    ? (response.rows[0] as EnrollmentDocument)
    : null;
}

/**
 * Enroll a student in a course
 */
export async function enrollStudent(
  data: CreateEnrollmentInput,
): Promise<EnrollmentDocument> {
  createEnrollmentInputSchema.parse(data);
  const existing = await getEnrollment(data.studentId, data.courseId);
  if (existing) {
    return existing;
  }

  const now = nowISO();

  const response = await databases.createRow<EnrollmentDocument>({
    databaseId: databaseId!,
    tableId: tables.enrollments!,
    rowId: ID.unique(),
    data: {
      studentId: data.studentId,
      courseId: data.courseId,
      status: "active",
      progress: 0,
      enrolledAt: now,
      completedAt: null,
    },
  });

  return response as EnrollmentDocument;
}

/**
 * Update enrollment progress
 */
export async function updateEnrollmentProgress(
  id: string,
  progress: number,
): Promise<EnrollmentDocument> {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const response = await databases.updateRow<EnrollmentDocument>({
    databaseId: databaseId!,
    tableId: tables.enrollments!,
    rowId: id,
    data: { progress: clampedProgress },
  });

  return response as EnrollmentDocument;
}

/**
 * Mark enrollment as completed
 */
export async function completeEnrollment(
  id: string,
): Promise<EnrollmentDocument> {
  const response = await databases.updateRow<EnrollmentDocument>({
    databaseId: databaseId!,
    tableId: tables.enrollments!,
    rowId: id,
    data: {
      status: "completed",
      progress: 100,
      completedAt: nowISO(),
    },
  });

  return response as EnrollmentDocument;
}

/**
 * Get enrollment count for a course
 */
export async function getEnrollmentCount(courseId: string): Promise<number> {
  const response = await databases.listRows({
    databaseId: databaseId!,
    tableId: tables.enrollments!,
    queries: [Query.equal("courseId", courseId), Query.limit(1)],
  });

  return response.total;
}

/**
 * Get recent enrollments (for teacher dashboard)
 */
export async function getRecentEnrollments(
  limit: number = 10,
): Promise<EnrollmentDocument[]> {
  const response = await databases.listRows<EnrollmentDocument>({
    databaseId: databaseId!,
    tableId: tables.enrollments!,
    queries: [Query.orderDesc("enrolledAt"), Query.limit(limit)],
  });

  return response.rows as EnrollmentDocument[];
}
