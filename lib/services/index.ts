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
  // Payment types
  CreateOrderInput,
  CreateOrderResponse,
  CreatePurchaseInput,
  CreateQuestionInput,
  CreateTestInput,
  EnrollmentDocument,
  PaginatedResponse,
  PaymentResult,
  PurchaseCourseOptions,
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
  buildQueries,
  dateRangeQuery,
  DEFAULT_LIMIT,
  getDateRangeFromFilter,
  MAX_LIMIT,
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
  getCourses,
  getCoursesByTeacher,
  getCourseWithStats,
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
  getTestsByCourse,
  getTestWithSubjects,
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

// ============================================================================
// Payment Service
// ============================================================================

export {
  canAccessCourse,
  courseRequiresPayment,
  createPaymentOrder,
  handlePaymentFailure,
  handlePaymentSuccess,
  isPaymentCancelled,
  openRazorpayCheckout,
  purchaseCourse,
  verifySignatureFormat,
} from "./payments";
