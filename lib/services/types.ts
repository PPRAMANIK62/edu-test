export interface PaginatedResponse<T> {
  documents: T[];
  total: number;
  hasMore: boolean;
}

export interface BaseRow {
  id: string;
  created_at: string;
}

export interface ProfileRow extends BaseRow {
  email: string;
  first_name: string;
  last_name: string;
  role: "teacher" | "teaching_assistant" | "student";
  is_primary_teacher: boolean;
  updated_at: string;
}

export interface CourseRow extends BaseRow {
  teacher_id: string;
  title: string;
  description: string;
  image_url: string;
  price: number;
  currency: string;
  subjects: string[];
  estimated_hours: number;
  is_published: boolean;
  updated_at: string;
}

export interface TestRow extends BaseRow {
  course_id: string;
  title: string;
  description: string;
  duration_minutes: number;
  passing_score: number;
  is_published: boolean;
  updated_at: string;
}

export interface TestSubjectRow extends BaseRow {
  test_id: string;
  name: string;
  question_count: number;
  order: number;
}

export interface QuestionRow extends BaseRow {
  test_id: string;
  subject_id: string;
  subject_name: string;
  type: "mcq";
  text: string;
  options: string[];
  correct_index: number;
  explanation: string;
  order: number;
}

export interface EnrollmentRow extends BaseRow {
  student_id: string;
  course_id: string;
  status: "active" | "completed";
  progress: number;
  enrolled_at: string;
  completed_at: string | null;
}

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface PurchaseRow extends BaseRow {
  student_id: string;
  course_id: string;
  amount: number;
  currency: string;
  purchased_at: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  payment_status: PaymentStatus;
  payment_method: string | null;
  webhook_verified: boolean;
  webhook_received_at: string | null;
}

/** Answer tuple: [questionIndex, selectedIndex, isMarkedForReview] */
export type Answer = [number, number, boolean];

export interface TestAttemptRow extends BaseRow {
  student_id: string;
  test_id: string;
  course_id: string;
  started_at: string;
  completed_at: string | null;
  status: "in_progress" | "completed" | "expired";
  answers: Answer[];
  score: number | null;
  percentage: number | null;
  passed: boolean | null;
}

export interface ActivityRow extends BaseRow {
  user_id: string;
  type: "test_completed" | "course_started" | "achievement";
  title: string;
  subtitle: string;
  metadata: Record<string, unknown>;
}

// ============================================================================
// Input Types
// ============================================================================

export interface CreateCourseInput {
  teacher_id: string;
  title: string;
  description: string;
  image_url: string;
  price: number;
  currency?: string;
  subjects: string[];
  estimated_hours: number;
  is_published?: boolean;
}

export interface UpdateCourseInput {
  title?: string;
  description?: string;
  image_url?: string;
  price?: number;
  currency?: string;
  subjects?: string[];
  estimated_hours?: number;
  is_published?: boolean;
}

export interface CreateTestInput {
  course_id: string;
  title: string;
  description: string;
  duration_minutes: number;
  passing_score: number;
  is_published?: boolean;
}

export interface UpdateTestInput {
  title?: string;
  description?: string;
  duration_minutes?: number;
  passing_score?: number;
  is_published?: boolean;
}

export interface CreateQuestionInput {
  test_id: string;
  subject_id: string;
  subject_name: string;
  type?: "mcq";
  text: string;
  options: string[];
  correct_index: number;
  explanation: string;
  order: number;
}

export interface UpdateQuestionInput {
  subject_id?: string;
  subject_name?: string;
  text?: string;
  options?: string[];
  correct_index?: number;
  explanation?: string;
  order?: number;
}

export interface CreateEnrollmentInput {
  student_id: string;
  course_id: string;
}

export interface CreatePurchaseInput {
  student_id: string;
  course_id: string;
  amount: number;
  currency?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  payment_status?: PaymentStatus;
  payment_method?: string;
}

export interface CreateActivityInput {
  user_id: string;
  type: "test_completed" | "course_started" | "achievement";
  title: string;
  subtitle: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Payment Types
// ============================================================================

export interface CreateOrderInput {
  course_id: string;
  student_id: string;
  student_email?: string;
  student_name?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  error?: string;
  order?: {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
  };
  course?: {
    id: string;
    title: string;
    image_url: string;
    price: number;
  };
  key?: string;
  prefill?: {
    email: string;
    name: string;
  };
}

export interface PaymentResult {
  success: boolean;
  purchase?: PurchaseRow;
  error?: string;
  cancelled?: boolean;
}

export interface PurchaseCourseOptions {
  course_id: string;
  student: ProfileRow;
  onPaymentStart?: () => void;
  onPaymentSuccess?: (purchase: PurchaseRow) => void;
  onPaymentFailure?: (error: string) => void;
  onPaymentCancel?: () => void;
}
