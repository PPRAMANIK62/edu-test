/**
 * Services barrel export
 * Re-exports all service functions and types for convenient imports
 */

// ============================================================================
// Types
// ============================================================================

export type {
  ActivityDocument,
  Answer,
  // Document types
  BaseDocument,
  CourseDocument,
  CreateActivityInput,
  // Input types
  CreateCourseInput,
  CreateEnrollmentInput,
  CreatePurchaseInput,
  CreateQuestionInput,
  CreateTestInput,
  EnrollmentDocument,
  PaginatedResponse,
  PurchaseDocument,
  QuestionDocument,
  TestAttemptDocument,
  TestDocument,
  TestSubjectDocument,
  UpdateCourseInput,
  UpdateQuestionInput,
  UpdateTestInput,
  UserDocument,
} from "./types";

export type { QueryOptions } from "./helpers";

// ============================================================================
// Helpers
// ============================================================================

export {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  buildQueries,
  dateRangeQuery,
  getDateRangeFromFilter,
  nowISO,
  parseJSON,
} from "./helpers";

// ============================================================================
// Course Service
// ============================================================================

export {
  createCourse,
  deleteCourse,
  getCourseById,
  getCourseWithStats,
  getCourses,
  getCoursesByTeacher,
  getEnrolledCourses,
  updateCourse,
} from "./courses";

// ============================================================================
// Test Service
// ============================================================================

export {
  createTest,
  createTestSubject,
  deleteTest,
  deleteTestSubject,
  getPublishedTestsByCourse,
  // Subject management
  getSubjectsByTest,
  getTestById,
  getTestWithSubjects,
  getTestsByCourse,
  updateTest,
  updateTestSubject,
} from "./tests";

// ============================================================================
// Question Service
// ============================================================================

export {
  bulkCreateQuestions,
  createQuestion,
  deleteQuestion,
  getQuestionById,
  getQuestionCount,
  getQuestionsBySubject,
  getQuestionsByTest,
  reorderQuestions,
  updateQuestion,
} from "./questions";

// ============================================================================
// Enrollment Service
// ============================================================================

export {
  completeEnrollment,
  enrollStudent,
  getActiveEnrollmentsByStudent,
  getEnrollment,
  getEnrollmentById,
  getEnrollmentCount,
  getEnrollmentsByCourse,
  getEnrollmentsByStudent,
  getRecentEnrollments,
  isStudentEnrolled,
  updateEnrollmentProgress,
} from "./enrollments";

// ============================================================================
// Purchase Service
// ============================================================================

export {
  createPurchase,
  getCourseRevenue,
  getPurchase,
  getPurchaseById,
  getPurchaseCount,
  getPurchasesByCourse,
  getPurchasesByStudent,
  getRecentPurchases,
  getTeacherRevenue,
  hasStudentPurchased,
} from "./purchases";

// ============================================================================
// Test Attempt Service
// ============================================================================

export {
  completeAttempt,
  expireAttempt,
  getAnswersFromAttempt,
  getAttemptById,
  getAttemptsByStudent,
  getAttemptsByTest,
  getBestAttempt,
  getCompletedAttemptsByTest,
  getInProgressAttempt,
  getStudentTestHistory,
  getTestAttemptStats,
  startAttempt,
  submitAnswer,
  submitAnswersBatch,
} from "./attempts";

// ============================================================================
// Activity Service
// ============================================================================

export {
  deleteActivitiesByUser,
  deleteActivity,
  getActivitiesByType,
  getActivitiesByUser,
  getActivityById,
  getActivityCountByType,
  getActivityMetadata,
  getRecentActivitiesByUser,
  logAchievement,
  logActivity,
  logCourseStarted,
  logTestCompleted,
} from "./activities";

// ============================================================================
// Analytics Service
// ============================================================================

export {
  getAverageCompletionRate,
  getCoursePerformanceData,
  getCoursePerformanceMetrics,
  getEnrichedRecentEnrollments,
  getRevenueAnalytics,
  getStudentEngagementMetrics,
  getStudentsWithStats,
  getTeacherDashboardStats,
  getTestAttemptCount,
} from "./analytics";
