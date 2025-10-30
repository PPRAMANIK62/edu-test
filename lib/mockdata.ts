import {
  Course,
  Question,
  RecentActivity,
  StudentDashboardStats,
  TeacherDashboardStats,
  Test,
} from "@/types";

export const MOCK_COURSES: Course[] = [
  {
    id: "course-1",
    title: "Complete SAT Math Preparation",
    description:
      "Master all SAT Math topics with comprehensive practice tests covering Algebra, Geometry, Statistics, and Advanced Math.",
    imageUrl:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800",
    price: 49.99,
    currency: "USD",
    teacherId: "teacher-1",
    teacherName: "Dr. Sarah Johnson",
    totalTests: 12,
    totalQuestions: 480,
    estimatedHours: 24,
    subjects: ["Algebra", "Geometry", "Statistics", "Advanced Math"],
    isPurchased: true,
    progress: 65,
    rating: 4.8,
    enrollmentCount: 1247,
  },
  {
    id: "course-2",
    title: "IELTS Academic Mastery",
    description:
      "Comprehensive preparation for IELTS Academic test with full-length practice tests, tips, and detailed explanations.",
    imageUrl:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800",
    price: 59.99,
    currency: "USD",
    teacherId: "teacher-2",
    teacherName: "Prof. Michael Chen",
    totalTests: 8,
    totalQuestions: 320,
    estimatedHours: 18,
    subjects: ["Reading", "Writing", "Listening", "Speaking"],
    isPurchased: false,
    rating: 4.9,
    enrollmentCount: 2156,
  },
  {
    id: "course-3",
    title: "Medical Entrance Exam Prep",
    description:
      "Complete preparation for NEET/MCAT with Biology, Chemistry, and Physics practice tests.",
    imageUrl:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800",
    price: 79.99,
    currency: "USD",
    teacherId: "teacher-1",
    teacherName: "Dr. Sarah Johnson",
    totalTests: 15,
    totalQuestions: 750,
    estimatedHours: 40,
    subjects: ["Biology", "Chemistry", "Physics"],
    isPurchased: true,
    progress: 32,
    rating: 4.7,
    enrollmentCount: 892,
  },
  {
    id: "course-4",
    title: "GRE Quantitative Reasoning",
    description:
      "Advanced GRE Quant preparation with arithmetic, algebra, geometry, and data analysis.",
    imageUrl:
      "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800",
    price: 44.99,
    currency: "USD",
    teacherId: "teacher-3",
    teacherName: "James Rodriguez",
    totalTests: 10,
    totalQuestions: 400,
    estimatedHours: 20,
    subjects: ["Arithmetic", "Algebra", "Geometry", "Data Analysis"],
    isPurchased: false,
    rating: 4.6,
    enrollmentCount: 743,
  },
];

export const MOCK_TESTS: Test[] = [
  {
    id: "test-1",
    courseId: "course-1",
    title: "SAT Math Practice Test 1",
    description: "Full-length SAT Math section covering all topics",
    durationMinutes: 80,
    totalQuestions: 58,
    subjects: [
      { id: "subj-1", name: "Algebra", questionCount: 20 },
      { id: "subj-2", name: "Geometry", questionCount: 15 },
      { id: "subj-3", name: "Statistics", questionCount: 13 },
      { id: "subj-4", name: "Advanced Math", questionCount: 10 },
    ],
    passingScore: 70,
    attemptCount: 2,
    bestScore: 78,
    isAvailable: true,
  },
  {
    id: "test-2",
    courseId: "course-1",
    title: "SAT Math Practice Test 2",
    description: "Advanced SAT Math practice with harder problems",
    durationMinutes: 80,
    totalQuestions: 58,
    subjects: [
      { id: "subj-1", name: "Algebra", questionCount: 18 },
      { id: "subj-2", name: "Geometry", questionCount: 16 },
      { id: "subj-3", name: "Statistics", questionCount: 14 },
      { id: "subj-4", name: "Advanced Math", questionCount: 10 },
    ],
    passingScore: 70,
    attemptCount: 0,
    isAvailable: true,
  },
  {
    id: "test-3",
    courseId: "course-3",
    title: "Biology - Cell Structure & Function",
    description: "Comprehensive test on cell biology",
    durationMinutes: 60,
    totalQuestions: 50,
    subjects: [{ id: "subj-5", name: "Cell Biology", questionCount: 50 }],
    passingScore: 75,
    attemptCount: 1,
    bestScore: 84,
    isAvailable: true,
  },
];

export const MOCK_QUESTIONS: Question[] = [
  {
    id: "q1",
    testId: "test-1",
    subjectId: "subj-1",
    subjectName: "Algebra",
    text: "If 3x + 7 = 22, what is the value of x?",
    options: [
      { id: "opt-1a", label: "A", text: "3" },
      { id: "opt-1b", label: "B", text: "5" },
      { id: "opt-1c", label: "C", text: "7" },
      { id: "opt-1d", label: "D", text: "9" },
    ],
    correctOptionId: "opt-1b",
    explanation:
      "To solve 3x + 7 = 22, subtract 7 from both sides: 3x = 15. Then divide by 3: x = 5.",
    order: 1,
  },
  {
    id: "q2",
    testId: "test-1",
    subjectId: "subj-1",
    subjectName: "Algebra",
    text: "What is the slope of the line passing through points (2, 3) and (6, 11)?",
    options: [
      { id: "opt-2a", label: "A", text: "1" },
      { id: "opt-2b", label: "B", text: "2" },
      { id: "opt-2c", label: "C", text: "3" },
      { id: "opt-2d", label: "D", text: "4" },
    ],
    correctOptionId: "opt-2b",
    explanation:
      "Slope = (y2 - y1) / (x2 - x1) = (11 - 3) / (6 - 2) = 8 / 4 = 2.",
    order: 2,
  },
  {
    id: "q3",
    testId: "test-1",
    subjectId: "subj-2",
    subjectName: "Geometry",
    text: "A circle has a radius of 7 cm. What is its area? (Use π ≈ 3.14)",
    options: [
      { id: "opt-3a", label: "A", text: "43.96 cm²" },
      { id: "opt-3b", label: "B", text: "153.86 cm²" },
      { id: "opt-3c", label: "C", text: "153.94 cm²" },
      { id: "opt-3d", label: "D", text: "175.84 cm²" },
    ],
    correctOptionId: "opt-3c",
    explanation: "Area of circle = πr² = 3.14 × 7² = 3.14 × 49 = 153.86 cm².",
    order: 3,
  },
  {
    id: "q4",
    testId: "test-1",
    subjectId: "subj-3",
    subjectName: "Statistics",
    text: "What is the median of the following set: 3, 7, 9, 12, 15, 18, 21?",
    options: [
      { id: "opt-4a", label: "A", text: "9" },
      { id: "opt-4b", label: "B", text: "12" },
      { id: "opt-4c", label: "C", text: "15" },
      { id: "opt-4d", label: "D", text: "18" },
    ],
    correctOptionId: "opt-4b",
    explanation:
      "The median is the middle value in an ordered set. With 7 values, the 4th value (12) is the median.",
    order: 4,
  },
  {
    id: "q5",
    testId: "test-1",
    subjectId: "subj-4",
    subjectName: "Advanced Math",
    text: "If f(x) = 2x² - 3x + 1, what is f(3)?",
    options: [
      { id: "opt-5a", label: "A", text: "8" },
      { id: "opt-5b", label: "B", text: "10" },
      { id: "opt-5c", label: "C", text: "12" },
      { id: "opt-5d", label: "D", text: "14" },
    ],
    correctOptionId: "opt-5b",
    explanation: "f(3) = 2(3)² - 3(3) + 1 = 2(9) - 9 + 1 = 18 - 9 + 1 = 10.",
    order: 5,
  },
];

export const MOCK_STUDENT_STATS: StudentDashboardStats = {
  coursesEnrolled: 2,
  testsCompleted: 5,
  averageScore: 81,
  totalStudyHours: 12.5,
};

export const MOCK_TEACHER_STATS: TeacherDashboardStats = {
  coursesCreated: 4,
  totalStudents: 3847,
  totalRevenue: 12459,
  averageRating: 4.7,
};

export const MOCK_RECENT_ACTIVITIES: RecentActivity[] = [
  {
    id: "act-1",
    type: "test_completed",
    title: "SAT Math Practice Test 1",
    subtitle: "Score: 78% • 58 questions",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata: { score: 78, passed: true },
  },
  {
    id: "act-2",
    type: "test_completed",
    title: "Biology - Cell Structure",
    subtitle: "Score: 84% • 50 questions",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    metadata: { score: 84, passed: true },
  },
  {
    id: "act-3",
    type: "course_started",
    title: "Complete SAT Math Preparation",
    subtitle: "Started learning • 12 tests available",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
