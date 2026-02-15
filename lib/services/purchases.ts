/**
 * Purchase Service
 * Handles all purchase-related database operations
 */

import { ID, Query } from "appwrite";
import { APPWRITE_CONFIG, databases } from "../appwrite";
import { fetchAllRows } from "../appwrite-helpers";
import { createPurchaseInputSchema } from "../schemas";
import { buildQueries, nowISO, type QueryOptions } from "./helpers";
import type {
  CreatePurchaseInput,
  PaginatedResponse,
  PurchaseDocument,
} from "./types";

const { databaseId, tables } = APPWRITE_CONFIG;

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get purchases by student ID
 */
export async function getPurchasesByStudent(
  studentId: string,
  options: QueryOptions = {},
): Promise<PaginatedResponse<PurchaseDocument>> {
  const queries = [
    Query.equal("studentId", studentId),
    Query.orderDesc("purchasedAt"),
    ...buildQueries(options),
  ];

  const response = await databases.listRows<PurchaseDocument>({
    databaseId: databaseId!,
    tableId: tables.purchases!,
    queries,
  });

  return {
    documents: response.rows as PurchaseDocument[],
    total: response.total,
    hasMore: response.total > (options.offset || 0) + response.rows.length,
  };
}

/**
 * Get purchases by course ID
 */
export async function getPurchasesByCourse(
  courseId: string,
  options: QueryOptions = {},
): Promise<PaginatedResponse<PurchaseDocument>> {
  const queries = [
    Query.equal("courseId", courseId),
    Query.orderDesc("purchasedAt"),
    ...buildQueries(options),
  ];

  const response = await databases.listRows<PurchaseDocument>({
    databaseId: databaseId!,
    tableId: tables.purchases!,
    queries,
  });

  return {
    documents: response.rows as PurchaseDocument[],
    total: response.total,
    hasMore: response.total > (options.offset || 0) + response.rows.length,
  };
}

/**
 * Get purchase by ID
 */
export async function getPurchaseById(
  purchaseId: string,
): Promise<PurchaseDocument | null> {
  try {
    const response = await databases.getRow<PurchaseDocument>({
      databaseId: databaseId!,
      tableId: tables.purchases!,
      rowId: purchaseId,
    });
    return response as PurchaseDocument;
  } catch {
    return null;
  }
}

/**
 * Check if student has purchased a course
 */
export async function hasStudentPurchased(
  studentId: string,
  courseId: string,
): Promise<boolean> {
  const response = await databases.listRows({
    databaseId: databaseId!,
    tableId: tables.purchases!,
    queries: [
      Query.equal("studentId", studentId),
      Query.equal("courseId", courseId),
      Query.limit(1),
    ],
  });

  return response.total > 0;
}

/**
 * Get purchase by student and course
 * Returns the purchase record if it exists
 */
export async function getPurchase(
  studentId: string,
  courseId: string,
): Promise<PurchaseDocument | null> {
  const response = await databases.listRows<PurchaseDocument>({
    databaseId: databaseId!,
    tableId: tables.purchases!,
    queries: [
      Query.equal("studentId", studentId),
      Query.equal("courseId", courseId),
      Query.limit(1),
    ],
  });

  if (response.total === 0) {
    return null;
  }

  return response.rows[0] as PurchaseDocument;
}

// ============================================================================
// Mutation Functions
// ============================================================================

/**
 * Create a new purchase
 */
export async function createPurchase(
  input: CreatePurchaseInput,
): Promise<PurchaseDocument> {
  createPurchaseInputSchema.parse(input);
  const existingPurchase = await getPurchase(input.studentId, input.courseId);
  if (existingPurchase) {
    throw new Error("Student has already purchased this course");
  }

  const now = nowISO();

  const response = await databases.createRow<PurchaseDocument>({
    databaseId: databaseId!,
    tableId: tables.purchases!,
    rowId: ID.unique(),
    data: {
      studentId: input.studentId,
      courseId: input.courseId,
      amount: input.amount,
      currency: input.currency || "INR",
      purchasedAt: now,
      paymentStatus: "pending",
      paymentMethod: null,
      razorpayOrderId: null,
      razorpayPaymentId: null,
      razorpaySignature: null,
      webhookVerified: false,
      webhookReceivedAt: null,
    },
  });

  return response as PurchaseDocument;
}

// ============================================================================
// Analytics Functions
// ============================================================================

/**
 * Get total revenue for a course
 */
export async function getCourseRevenue(courseId: string): Promise<number> {
  const result = await fetchAllRows<PurchaseDocument>(tables.purchases!, [
    Query.equal("courseId", courseId),
  ]);
  return result.rows.reduce((sum, purchase) => sum + purchase.amount, 0);
}

/**
 * Get total revenue for a teacher (across all their courses)
 */
export async function getTeacherRevenue(
  courseIds: string[],
): Promise<{ total: number; byCourse: Record<string, number> }> {
  const byCourse: Record<string, number> = {};
  let total = 0;

  for (const courseId of courseIds) {
    const revenue = await getCourseRevenue(courseId);
    byCourse[courseId] = revenue;
    total += revenue;
  }

  return { total, byCourse };
}

/**
 * Get purchase count for a course
 */
export async function getPurchaseCount(courseId: string): Promise<number> {
  const response = await databases.listRows({
    databaseId: databaseId!,
    tableId: tables.purchases!,
    queries: [Query.equal("courseId", courseId), Query.limit(1)],
  });

  return response.total;
}

/**
 * Get recent purchases across all courses (for admin/teacher dashboard)
 */
export async function getRecentPurchases(
  courseIds?: string[],
  limit: number = 10,
): Promise<PurchaseDocument[]> {
  const queries: string[] = [
    Query.orderDesc("purchasedAt"),
    Query.limit(limit),
  ];

  if (courseIds && courseIds.length > 0) {
    queries.unshift(Query.equal("courseId", courseIds));
  }

  const response = await databases.listRows<PurchaseDocument>({
    databaseId: databaseId!,
    tableId: tables.purchases!,
    queries,
  });

  return response.rows as PurchaseDocument[];
}
