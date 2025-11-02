export type UserRole = "teacher" | "student";

export interface UserProfile {
  $id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AppwriteUser {
  $id: string;
  email: string;
  name: string;
  emailVerification: boolean;
  prefs: Record<string, unknown>;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  currency: string;
  teacherId: string;
  teacherName: string;
  totalTests: number;
  totalQuestions: number;
  estimatedHours: number;
  subjects: string[];
  isPurchased: boolean;
  progress?: number;
  rating?: number;
  enrollmentCount: number;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  enrolledCourses: number;
  completedTests: number;
  averageScore: number;
  totalSpent: number;
  lastActive: string;
  status: "active" | "inactive";
}

export interface Test {
  id: string;
  courseId: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  subjects: Subject[];
  passingScore: number;
  attemptCount: number;
  bestScore?: number;
  isAvailable: boolean;
}

export interface Subject {
  id: string;
  name: string;
  questionCount: number;
}

export interface Question {
  id: string;
  testId: string;
  subjectId: string;
  subjectName: string;
  text: string;
  options: QuestionOption[];
  correctOptionId: string;
  explanation: string;
  order: number;
}

export interface QuestionOption {
  id: string;
  label: "A" | "B" | "C" | "D";
  text: string;
}

export interface Attempt {
  id: string;
  testId: string;
  userId: string;
  startTime: string;
  endTime: string;
  submittedAt?: string;
  status: "in_progress" | "completed" | "expired";
  answers: AttemptAnswer[];
  score?: number;
  percentage?: number;
}

export interface AttemptAnswer {
  questionId: string;
  selectedOptionId?: string;
  isMarkedForReview: boolean;
  isCorrect?: boolean;
}

export interface AttemptResult {
  attempt: Attempt;
  questions: Question[];
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  score: number;
  percentage: number;
  passed: boolean;
}

export interface StudentDashboardStats {
  coursesEnrolled: number;
  testsCompleted: number;
  averageScore: number;
  totalStudyHours: number;
}

export interface TeacherDashboardStats {
  coursesCreated: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
}

export interface RecentActivity {
  id: string;
  type: "test_completed" | "course_started" | "achievement";
  title: string;
  subtitle: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface RecentEnrollment {
  id: string;
  studentName: string;
  courseTitle: string;
  enrolledAt: string;
  status: "active" | "completed";
}

export interface CourseFormData {
  title: string;
  description: string;
  price: string;
  subjects: string[];
  estimatedHours: string;
  imageUrl: string;
}

export interface StudentEnrollment {
  id: string;
  studentId: string;
  courseId: string;
  courseTitle: string;
  enrolledAt: string;
  progress: number;
  status: "active" | "completed";
}

export interface StudentTestAttempt {
  id: string;
  studentId: string;
  testId: string;
  testTitle: string;
  score: number;
  percentage: number;
  completedAt: string;
  passed: boolean;
}

// Analytics Types

/**
 * Time range filter for analytics queries
 */
export type TimeRangeFilter = "7d" | "30d" | "90d" | "1y" | "all";

/**
 * Options for analytics queries
 */
export interface AnalyticsQueryOptions {
  timeRange?: TimeRangeFilter;
  courseId?: string;
}

/**
 * Course performance metrics calculated from database
 */
export interface CoursePerformanceMetrics {
  courseId: string;
  courseTitle: string;
  totalRevenue: number;
  totalEnrollments: number;
  averageRating: number;
  completionRate: number;
  trends: {
    revenueChange: number; // percentage
    enrollmentChange: number; // percentage
    ratingChange: number; // percentage
  };
}

/**
 * Student engagement metrics for a course
 */
export interface StudentEngagementMetrics {
  totalStudents: number;
  activeStudents: number; // students with at least one test attempt
  averageTestScore: number;
  totalTestAttempts: number;
  completionRate: number;
}

/**
 * Revenue analytics metrics
 */
export interface RevenueMetrics {
  totalRevenue: number;
  revenueByMonth: { month: string; revenue: number }[];
  topCourses: {
    courseId: string;
    courseTitle: string;
    revenue: number;
  }[];
  trends: {
    percentageChange: number;
    comparisonPeriod: string;
  };
}

/**
 * Mock data types for analytics calculations
 */
export interface MockEnrollment {
  id: string;
  courseId: string;
  studentId: string;
  enrolledAt: string;
  status: "active" | "completed";
  progress: number;
}

export interface MockTestAttempt {
  id: string;
  testId: string;
  courseId: string;
  studentId: string;
  score: number;
  percentage: number;
  completedAt: string;
  passed: boolean;
}

export interface MockPurchase {
  id: string;
  courseId: string;
  studentId: string;
  amount: number;
  purchasedAt: string;
}
