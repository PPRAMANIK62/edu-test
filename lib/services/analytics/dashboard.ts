/**
 * Teacher Dashboard Analytics
 *
 * Functions for the teacher dashboard stats and enriched data.
 */

import { supabase } from "../../supabase";
import { fetchAllRows, TABLES } from "../../supabase-helpers";
import type {
  CourseRow,
  EnrollmentRow,
  ProfileRow,
  PurchaseRow,
} from "../types";

/**
 * Get aggregated stats for teacher dashboard
 */
export async function getTeacherDashboardStats(teacherId: string): Promise<{
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageCompletionRate: number;
}> {
  // Get teacher's courses
  const { data: courses, error: courseError } = await supabase
    .from(TABLES.courses)
    .select("*")
    .eq("teacher_id", teacherId)
    .limit(100);

  if (courseError) throw courseError;

  const typedCourses = (courses ?? []) as CourseRow[];
  const courseIds = typedCourses.map((c) => c.id);
  const totalCourses = typedCourses.length;

  if (courseIds.length === 0) {
    return {
      totalCourses: 0,
      totalStudents: 0,
      totalRevenue: 0,
      averageCompletionRate: 0,
    };
  }

  const [enrollments, purchases] = await Promise.all([
    fetchAllRows<EnrollmentRow>(TABLES.enrollments, (q) =>
      q.in("course_id", courseIds),
    ),
    fetchAllRows<PurchaseRow>(TABLES.purchases, (q) =>
      q.in("course_id", courseIds),
    ),
  ]);

  const uniqueStudents = new Set(enrollments.map((e) => e.student_id));
  const totalStudents = uniqueStudents.size;

  const completedEnrollments = enrollments.filter(
    (e) => e.status === "completed",
  );
  const averageCompletionRate =
    enrollments.length > 0
      ? (completedEnrollments.length / enrollments.length) * 100
      : 0;

  const totalRevenue = purchases.reduce((sum, p) => sum + p.amount, 0);

  return {
    totalCourses,
    totalStudents,
    totalRevenue,
    averageCompletionRate,
  };
}

/**
 * Get enriched enrollment data with student and course names
 */
export async function getEnrichedRecentEnrollments(limit: number = 10): Promise<
  {
    id: string;
    studentId: string;
    studentName: string;
    courseId: string;
    courseTitle: string;
    enrolledAt: string;
    status: "active" | "completed";
  }[]
> {
  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from(TABLES.enrollments)
    .select("*")
    .order("enrolled_at", { ascending: false })
    .limit(limit);

  if (enrollmentError) throw enrollmentError;

  const enrollments = (enrollmentData ?? []) as EnrollmentRow[];

  if (enrollments.length === 0) {
    return [];
  }

  const studentIds = Array.from(new Set(enrollments.map((e) => e.student_id)));
  const courseIds = Array.from(new Set(enrollments.map((e) => e.course_id)));

  const [studentResponse, courseResponse] = await Promise.all([
    supabase.from(TABLES.profiles).select("*").in("id", studentIds).limit(100),
    supabase.from(TABLES.courses).select("*").in("id", courseIds).limit(100),
  ]);

  if (studentResponse.error) throw studentResponse.error;
  if (courseResponse.error) throw courseResponse.error;

  const students = (studentResponse.data ?? []) as ProfileRow[];
  const courses = (courseResponse.data ?? []) as CourseRow[];

  const studentMap = new Map<string, string>();
  students.forEach((s) => {
    studentMap.set(s.id, `${s.first_name} ${s.last_name}`);
  });

  const courseMap = new Map<string, string>();
  courses.forEach((c) => {
    courseMap.set(c.id, c.title);
  });

  return enrollments.map((enrollment) => ({
    id: enrollment.id,
    studentId: enrollment.student_id,
    studentName: studentMap.get(enrollment.student_id) || "Unknown Student",
    courseId: enrollment.course_id,
    courseTitle: courseMap.get(enrollment.course_id) || "Unknown Course",
    enrolledAt: enrollment.enrolled_at,
    status: enrollment.status as "active" | "completed",
  }));
}
