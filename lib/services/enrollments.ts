import { supabase } from "../supabase";
import { createEnrollmentInputSchema } from "../schemas";
import { nowISO, DEFAULT_LIMIT, MAX_LIMIT, type QueryOptions } from "./helpers";
import type {
  CreateEnrollmentInput,
  EnrollmentRow,
  PaginatedResponse,
} from "./types";

export async function getEnrollmentsByStudent(
  student_id: string,
  options: QueryOptions = {},
): Promise<PaginatedResponse<EnrollmentRow>> {
  const limit = Math.min(options.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = options.offset || 0;

  const { data, error, count } = await supabase
    .from("enrollments")
    .select("*", { count: "exact" })
    .eq("student_id", student_id)
    .order(options.orderBy || "enrolled_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const rows = (data ?? []) as EnrollmentRow[];
  return {
    documents: rows,
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + rows.length,
  };
}

export async function getActiveEnrollmentsByStudent(
  student_id: string,
  options: QueryOptions = {},
): Promise<PaginatedResponse<EnrollmentRow>> {
  const limit = Math.min(options.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = options.offset || 0;

  const { data, error, count } = await supabase
    .from("enrollments")
    .select("*", { count: "exact" })
    .eq("student_id", student_id)
    .eq("status", "active")
    .order(options.orderBy || "enrolled_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const rows = (data ?? []) as EnrollmentRow[];
  return {
    documents: rows,
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + rows.length,
  };
}

export async function getEnrollmentsByCourse(
  course_id: string,
  options: QueryOptions = {},
): Promise<PaginatedResponse<EnrollmentRow>> {
  const limit = Math.min(options.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = options.offset || 0;

  const { data, error, count } = await supabase
    .from("enrollments")
    .select("*", { count: "exact" })
    .eq("course_id", course_id)
    .order(options.orderBy || "enrolled_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const rows = (data ?? []) as EnrollmentRow[];
  return {
    documents: rows,
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + rows.length,
  };
}

export async function getEnrollmentById(id: string): Promise<EnrollmentRow> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as EnrollmentRow;
}

export async function isStudentEnrolled(
  student_id: string,
  course_id: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", student_id)
    .eq("course_id", course_id)
    .limit(1);

  if (error) throw error;
  return (data ?? []).length > 0;
}

export async function getEnrollment(
  student_id: string,
  course_id: string,
): Promise<EnrollmentRow | null> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("*")
    .eq("student_id", student_id)
    .eq("course_id", course_id)
    .maybeSingle();

  if (error) throw error;
  return data as EnrollmentRow | null;
}

export async function enrollStudent(
  data: CreateEnrollmentInput,
): Promise<EnrollmentRow> {
  createEnrollmentInputSchema.parse(data);
  const existing = await getEnrollment(data.student_id, data.course_id);
  if (existing) return existing;

  const now = nowISO();

  const { data: row, error } = await supabase
    .from("enrollments")
    .insert({
      student_id: data.student_id,
      course_id: data.course_id,
      status: "active",
      progress: 0,
      enrolled_at: now,
      completed_at: null,
    })
    .select()
    .single();

  if (error) throw error;
  return row as EnrollmentRow;
}

export async function updateEnrollmentProgress(
  id: string,
  progress: number,
): Promise<EnrollmentRow> {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const { data, error } = await supabase
    .from("enrollments")
    .update({ progress: clampedProgress })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as EnrollmentRow;
}

export async function completeEnrollment(id: string): Promise<EnrollmentRow> {
  const { data, error } = await supabase
    .from("enrollments")
    .update({
      status: "completed",
      progress: 100,
      completed_at: nowISO(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as EnrollmentRow;
}

export async function getEnrollmentCount(course_id: string): Promise<number> {
  const { count, error } = await supabase
    .from("enrollments")
    .select("*", { count: "exact", head: true })
    .eq("course_id", course_id);

  if (error) throw error;
  return count ?? 0;
}

export async function getRecentEnrollments(
  limit: number = 10,
): Promise<EnrollmentRow[]> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("*")
    .order("enrolled_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as EnrollmentRow[];
}
