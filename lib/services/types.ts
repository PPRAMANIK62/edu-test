/**
 * Common types for service layer
 */

import type { Models } from "appwrite";

// ============================================================================
// Service Response Types
// ============================================================================

/**
 * Standard service response wrapper
 */
export interface ServiceResponse<T> {
  data: T;
  success: true;
}

/**
 * Service error response
 */
export interface ServiceError {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

/**
 * Union type for service results
 */
export type ServiceResult<T> = ServiceResponse<T> | ServiceError;

/**
 * Paginated list response
 */
export interface PaginatedResponse<T> {
  documents: T[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// Database Document Types (matches Appwrite TablesDB schema)
// ============================================================================

/**
 * Base row with Appwrite TablesDB metadata
 */
export interface BaseDocument extends Models.Row {
  $id: string;
  $tableId: string;
  $databaseId: string;
  $sequence: number;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
}

/**
 * Course document from database
 */
export interface CourseDocument extends BaseDocument {
  teacherId: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  currency: string;
  subjects: string[];
  estimatedHours: number;
  isPublished: boolean;
}

/**
 * Test document from database
 */
export interface TestDocument extends BaseDocument {
  courseId: string;
  title: string;
  description: string;
  durationMinutes: number;
  passingScore: number;
  isPublished: boolean;
}

/**
 * Test subject document from database
 */
export interface TestSubjectDocument extends BaseDocument {
  testId: string;
  name: string;
  questionCount: number;
  order: number;
}

/**
 * Question document from database
 * Options stored as string array: ["Option A", "Option B", "Option C", "Option D"]
 * correctIndex: 0-3 indicating correct option
 */
export interface QuestionDocument extends BaseDocument {
  testId: string;
  subjectId: string;
  subjectName: string;
  type: "mcq";
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  order: number;
}

/**
 * User document from database
 */
export interface UserDocument extends BaseDocument {
  email: string;
  firstName: string;
  lastName: string;
  role: "teacher" | "teaching_assistant" | "student";
  isPrimaryTeacher?: boolean;
}

/**
 * Enrollment document from database
 */
export interface EnrollmentDocument extends BaseDocument {
  studentId: string;
  courseId: string;
  status: "active" | "completed";
  progress: number;
  enrolledAt: string;
  completedAt: string | null;
}

/**
 * Purchase document from database
 */
export interface PurchaseDocument extends BaseDocument {
  studentId: string;
  courseId: string;
  amount: number;
  currency: string;
  purchasedAt: string;
}

/**
 * Answer format: [questionIndex, selectedIndex, isMarkedForReview]
 * Example: [0, 1, false] = Question 0, Option B selected, not marked for review
 */
export type Answer = [number, number, boolean];

/**
 * Test attempt document from database
 */
export interface TestAttemptDocument extends BaseDocument {
  studentId: string;
  testId: string;
  courseId: string;
  startedAt: string;
  completedAt: string | null;
  status: "in_progress" | "completed" | "expired";
  answers: string; // JSON.stringify(Answer[])
  score: number | null;
  percentage: number | null;
  passed: boolean | null;
}

/**
 * Activity document from database
 * Note: Uses $createdAt from BaseDocument for timestamp
 */
export interface ActivityDocument extends BaseDocument {
  userId: string;
  type: "test_completed" | "course_started" | "achievement";
  title: string;
  subtitle: string;
  metadata: string; // JSON string
}

// ============================================================================
// Input Types for Create/Update Operations
// ============================================================================

export interface CreateCourseInput {
  teacherId: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  currency?: string;
  subjects: string[];
  estimatedHours: number;
  isPublished?: boolean;
}

export interface UpdateCourseInput {
  title?: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  subjects?: string[];
  estimatedHours?: number;
  isPublished?: boolean;
}

export interface CreateTestInput {
  courseId: string;
  title: string;
  description: string;
  durationMinutes: number;
  passingScore: number;
  isPublished?: boolean;
}

export interface UpdateTestInput {
  title?: string;
  description?: string;
  durationMinutes?: number;
  passingScore?: number;
  isPublished?: boolean;
}

export interface CreateQuestionInput {
  testId: string;
  subjectId: string;
  subjectName: string;
  type?: "mcq";
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  order: number;
}

export interface UpdateQuestionInput {
  subjectId?: string;
  subjectName?: string;
  text?: string;
  options?: string[];
  correctIndex?: number;
  explanation?: string;
  order?: number;
}

export interface CreateEnrollmentInput {
  studentId: string;
  courseId: string;
}

export interface CreatePurchaseInput {
  studentId: string;
  courseId: string;
  amount: number;
  currency?: string;
}

export interface CreateActivityInput {
  userId: string;
  type: "test_completed" | "course_started" | "achievement";
  title: string;
  subtitle: string;
  metadata?: Record<string, unknown>;
}
