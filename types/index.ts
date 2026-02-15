import type { User } from "@supabase/supabase-js";

export type UserRole = "teacher" | "teaching_assistant" | "student";

export type SupabaseUser = User;

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_primary_teacher?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  image_url: string;
  price: number;
  currency: string;
  teacher_id: string;
  teacher_name: string;
  total_tests: number;
  total_questions: number;
  estimated_hours: number;
  subjects: string[];
  is_purchased: boolean;
  progress?: number;
  enrollment_count: number;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  enrolled_courses: number;
  completed_tests: number;
  average_score: number;
  total_spent: number;
  last_active: string;
  status: "active" | "inactive";
}

export interface Test {
  id: string;
  course_id: string;
  title: string;
  description: string;
  duration_minutes: number;
  total_questions: number;
  subjects: Subject[];
  passing_score: number;
  attempt_count: number;
  best_score?: number;
  is_available: boolean;
}

export interface Subject {
  id: string;
  name: string;
  question_count: number;
}

export type QuestionType = "mcq";

export interface BaseQuestion {
  id: string;
  test_id: string;
  subject_id: string;
  subject_name: string;
  text: string;
  order: number;
}

export interface MCQQuestion extends BaseQuestion {
  type: "mcq";
  options: QuestionOption[];
  correct_option_id: string;
  explanation: string;
}

export type Question = MCQQuestion;

export interface QuestionOption {
  id: string;
  label: "A" | "B" | "C" | "D" | "E" | "F";
  text: string;
}

export interface MCQFormData {
  text: string;
  subject_id: string;
  options: QuestionOption[];
  correct_option_id: string;
  explanation: string;
}

export interface Attempt {
  id: string;
  test_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  submitted_at?: string;
  status: "in_progress" | "completed" | "expired";
  answers: AttemptAnswer[];
  score?: number;
  percentage?: number;
}

export interface AttemptAnswer {
  question_id: string;
  selected_option_id?: string;
  is_marked_for_review: boolean;
  is_correct?: boolean;
}

export interface AttemptResult {
  attempt: Attempt;
  questions: Question[];
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  score: number;
  percentage: number;
  passed: boolean;
}

export interface StudentDashboardStats {
  courses_enrolled: number;
  tests_completed: number;
  average_score: number;
  total_study_hours: number;
}

export interface TeacherDashboardStats {
  courses_created: number;
  total_students: number;
  total_revenue: number;
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
  student_name: string;
  course_title: string;
  enrolled_at: string;
  status: "active" | "completed";
}

export interface CourseFormData {
  title: string;
  description: string;
  price: string;
  subjects: string[];
  estimated_hours: string;
  image_url: string;
}

export interface StudentEnrollment {
  id: string;
  student_id: string;
  course_id: string;
  course_title: string;
  enrolled_at: string;
  progress: number;
  status: "active" | "completed";
}

export interface StudentTestAttempt {
  id: string;
  student_id: string;
  test_id: string;
  test_title: string;
  score: number;
  percentage: number;
  completed_at: string;
  passed: boolean;
}

export type TimeRangeFilter = "7d" | "30d" | "90d" | "1y" | "all";

export interface AnalyticsQueryOptions {
  time_range?: TimeRangeFilter;
  course_id?: string;
}

export interface CoursePerformanceMetrics {
  course_id: string;
  course_title: string;
  total_revenue: number;
  total_enrollments: number;
  average_rating: number;
  completion_rate: number;
  trends: {
    revenue_change: number;
    enrollment_change: number;
    rating_change: number;
  };
}

export interface StudentEngagementMetrics {
  total_students: number;
  active_students: number;
  average_test_score: number;
  total_test_attempts: number;
  completion_rate: number;
}

export interface RevenueMetrics {
  total_revenue: number;
  revenue_by_month: { month: string; revenue: number }[];
  top_courses: {
    course_id: string;
    course_title: string;
    revenue: number;
    enrollment_count: number;
    test_count: number;
  }[];
  trends: {
    percentage_change: number;
    comparison_period: string;
  };
}

// ============================================================================
// Razorpay Types (re-exported from lib/razorpay.ts)
// ============================================================================

export type {
  RazorpayCheckoutOptions,
  RazorpayErrorResponse,
  RazorpayOrder,
  RazorpayPaymentEntity,
  RazorpayRefundEntity,
  RazorpaySuccessResponse,
  RazorpayWebhookEventType,
  RazorpayWebhookPayload,
} from "../lib/razorpay";
