/**
 * Teacher Dashboard Analytics
 *
 * Functions for the teacher dashboard stats and enriched data.
 */

import { Query } from "appwrite";
import { APPWRITE_CONFIG, databases } from "../../appwrite";
import { fetchAllRows, typedListRows } from "../../appwrite-helpers";
import type {
  CourseDocument,
  EnrollmentDocument,
  PurchaseDocument,
  UserDocument,
} from "../types";

const { databaseId, tables } = APPWRITE_CONFIG;

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
  const courseResponse = await databases.listRows<CourseDocument>({
    databaseId: databaseId!,
    tableId: tables.courses!,
    queries: [Query.equal("teacherId", teacherId), Query.limit(100)],
  });

  const courses = courseResponse.rows as CourseDocument[];
  const courseIds = courses.map((c) => c.$id);
  const totalCourses = courses.length;

  if (courseIds.length === 0) {
    return {
      totalCourses: 0,
      totalStudents: 0,
      totalRevenue: 0,
      averageCompletionRate: 0,
    };
  }

  const [enrollmentResponse, purchaseResponse] = await Promise.all([
    fetchAllRows<EnrollmentDocument>(tables.enrollments!, [
      Query.equal("courseId", courseIds),
    ]),
    fetchAllRows<PurchaseDocument>(tables.purchases!, [
      Query.equal("courseId", courseIds),
    ]),
  ]);

  const enrollments = enrollmentResponse.rows;

  const uniqueStudents = new Set(enrollments.map((e) => e.studentId));
  const totalStudents = uniqueStudents.size;

  const completedEnrollments = enrollments.filter(
    (e) => e.status === "completed",
  );
  const averageCompletionRate =
    enrollments.length > 0
      ? (completedEnrollments.length / enrollments.length) * 100
      : 0;

  const totalRevenue = purchaseResponse.rows.reduce(
    (sum, p) => sum + p.amount,
    0,
  );

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
  // Get recent enrollments
  const enrollmentResponse = await databases.listRows<EnrollmentDocument>({
    databaseId: databaseId!,
    tableId: tables.enrollments!,
    queries: [Query.orderDesc("enrolledAt"), Query.limit(limit)],
  });

  const enrollments = enrollmentResponse.rows as EnrollmentDocument[];

  if (enrollments.length === 0) {
    return [];
  }

  // Get unique student and course IDs
  const studentIds = [...new Set(enrollments.map((e) => e.studentId))];
  const courseIds = [...new Set(enrollments.map((e) => e.courseId))];

  const [studentResponse, courseResponse] = await Promise.all([
    typedListRows<UserDocument>(tables.users!, [
      Query.equal("$id", studentIds),
      Query.limit(100),
    ]),
    typedListRows<CourseDocument>(tables.courses!, [
      Query.equal("$id", courseIds),
      Query.limit(100),
    ]),
  ]);

  const studentMap = new Map<string, string>();
  studentResponse.rows.forEach((s) => {
    studentMap.set(s.$id, `${s.firstName} ${s.lastName}`);
  });

  const courseMap = new Map<string, string>();
  courseResponse.rows.forEach((c) => {
    courseMap.set(c.$id, c.title);
  });

  // Build enriched results
  return enrollments.map((enrollment) => ({
    id: enrollment.$id,
    studentId: enrollment.studentId,
    studentName: studentMap.get(enrollment.studentId) || "Unknown Student",
    courseId: enrollment.courseId,
    courseTitle: courseMap.get(enrollment.courseId) || "Unknown Course",
    enrolledAt: enrollment.enrolledAt,
    status: enrollment.status as "active" | "completed",
  }));
}
