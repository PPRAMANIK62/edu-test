import { supabase } from "../supabase";
import { fetchAllRows } from "../supabase-helpers";
import { createCourseInputSchema, updateCourseInputSchema } from "../schemas";
import {
  buildCountMap,
  requireOwnership,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  type QueryOptions,
} from "./helpers";
import type {
  CourseRow,
  CreateCourseInput,
  EnrollmentRow,
  PaginatedResponse,
  TestRow,
  UpdateCourseInput,
} from "./types";

async function enrichCoursesWithStats(
  courses: CourseRow[],
  extraTestFilter?: { is_published: boolean },
): Promise<(CourseRow & { enrollment_count: number; test_count: number })[]> {
  if (courses.length === 0) return [];

  const courseIds = courses.map((c) => c.id);

  const [enrollments, tests] = await Promise.all([
    fetchAllRows<EnrollmentRow>("enrollments", (q) =>
      q.in("course_id", courseIds),
    ),
    fetchAllRows<TestRow>("tests", (q) => {
      let query = q.in("course_id", courseIds);
      if (extraTestFilter?.is_published !== undefined) {
        query = query.eq("is_published", extraTestFilter.is_published);
      }
      return query;
    }),
  ]);

  const enrollmentCountMap = buildCountMap(
    enrollments as unknown as Record<string, unknown>[],
    "course_id",
  );
  const testCountMap = buildCountMap(
    tests as unknown as Record<string, unknown>[],
    "course_id",
  );

  return courses.map((course) => ({
    ...course,
    enrollment_count: enrollmentCountMap.get(course.id) || 0,
    test_count: testCountMap.get(course.id) || 0,
  }));
}

export async function getCourses(
  options: QueryOptions = {},
): Promise<
  PaginatedResponse<
    CourseRow & { enrollment_count: number; test_count: number }
  >
> {
  const limit = Math.min(options.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = options.offset || 0;

  const { data, error, count } = await supabase
    .from("courses")
    .select("*", { count: "exact" })
    .eq("is_published", true)
    .order(options.orderBy || "created_at", {
      ascending: options.orderType === "asc",
    })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const rows = (data ?? []) as CourseRow[];

  if (rows.length === 0) {
    return { documents: [], total: 0, hasMore: false };
  }

  const coursesWithStats = await enrichCoursesWithStats(rows);

  return {
    documents: coursesWithStats,
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + rows.length,
  };
}

export async function getCourseById(id: string): Promise<CourseRow> {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as CourseRow;
}

export async function getCoursesByTeacher(
  teacher_id: string,
  options: QueryOptions = {},
): Promise<
  PaginatedResponse<
    CourseRow & { enrollment_count: number; test_count: number }
  >
> {
  const limit = Math.min(options.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = options.offset || 0;

  const { data, error, count } = await supabase
    .from("courses")
    .select("*", { count: "exact" })
    .eq("teacher_id", teacher_id)
    .order(options.orderBy || "created_at", {
      ascending: options.orderType === "asc",
    })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const rows = (data ?? []) as CourseRow[];

  if (rows.length === 0) {
    return { documents: [], total: 0, hasMore: false };
  }

  const coursesWithStats = await enrichCoursesWithStats(rows);

  return {
    documents: coursesWithStats,
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + rows.length,
  };
}

export async function getEnrolledCourses(
  student_id: string,
  options: QueryOptions = {},
): Promise<
  PaginatedResponse<
    CourseRow & { enrollment_count: number; test_count: number }
  >
> {
  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("student_id", student_id)
    .eq("status", "active")
    .limit(100);

  if (enrollmentError) throw enrollmentError;
  if (!enrollmentData || enrollmentData.length === 0) {
    return { documents: [], total: 0, hasMore: false };
  }

  const courseIds = enrollmentData.map((e) => e.course_id);
  const limit = Math.min(options.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = options.offset || 0;

  const { data, error, count } = await supabase
    .from("courses")
    .select("*", { count: "exact" })
    .in("id", courseIds)
    .order(options.orderBy || "created_at", {
      ascending: options.orderType === "asc",
    })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const rows = (data ?? []) as CourseRow[];

  if (rows.length === 0) {
    return { documents: [], total: 0, hasMore: false };
  }

  const coursesWithStats = await enrichCoursesWithStats(rows, {
    is_published: true,
  });

  return {
    documents: coursesWithStats,
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + rows.length,
  };
}

export async function createCourse(
  data: CreateCourseInput,
  callingUserId: string,
): Promise<CourseRow> {
  createCourseInputSchema.parse(data);
  requireOwnership(
    { teacher_id: data.teacher_id },
    callingUserId,
    "create",
    "courses",
  );

  const { data: row, error } = await supabase
    .from("courses")
    .insert({
      teacher_id: data.teacher_id,
      title: data.title,
      description: data.description,
      image_url: data.image_url,
      price: data.price,
      currency: data.currency || "INR",
      subjects: data.subjects,
      estimated_hours: data.estimated_hours,
      is_published: data.is_published ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  return row as CourseRow;
}

export async function updateCourse(
  id: string,
  data: UpdateCourseInput,
  callingUserId: string,
): Promise<CourseRow> {
  updateCourseInputSchema.parse(data);
  const course = await getCourseById(id);
  requireOwnership(course, callingUserId, "update", "courses");

  const { data: row, error } = await supabase
    .from("courses")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return row as CourseRow;
}

export async function deleteCourse(
  id: string,
  callingUserId: string,
): Promise<void> {
  const course = await getCourseById(id);
  requireOwnership(course, callingUserId, "delete", "courses");

  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw error;
}

export async function getCourseWithStats(id: string): Promise<
  CourseRow & {
    enrollment_count: number;
    test_count: number;
    question_count: number;
  }
> {
  const course = await getCourseById(id);

  const [enrollmentResult, testResult] = await Promise.all([
    supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("course_id", id),
    supabase.from("tests").select("id").eq("course_id", id),
  ]);

  if (enrollmentResult.error) throw enrollmentResult.error;
  if (testResult.error) throw testResult.error;

  let question_count = 0;
  const testIds = (testResult.data ?? []).map((t) => t.id);
  if (testIds.length > 0) {
    const { count, error } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .in("test_id", testIds);
    if (error) throw error;
    question_count = count ?? 0;
  }

  return {
    ...course,
    enrollment_count: enrollmentResult.count ?? 0,
    test_count: testIds.length,
    question_count,
  };
}
