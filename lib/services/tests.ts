import { supabase } from "../supabase";
import { fetchAllRows } from "../supabase-helpers";
import { createTestInputSchema, updateTestInputSchema } from "../schemas";
import { getCourseById } from "./courses";
import {
  requireOwnership,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  type QueryOptions,
} from "./helpers";
import type {
  CreateTestInput,
  PaginatedResponse,
  QuestionRow,
  TestRow,
  TestSubjectRow,
  UpdateTestInput,
} from "./types";

export async function getTestsByCourse(
  course_id: string,
  options: QueryOptions = {},
): Promise<
  PaginatedResponse<TestRow & { question_count: number; subject_count: number }>
> {
  const limit = Math.min(options.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = options.offset || 0;

  const { data, error, count } = await supabase
    .from("tests")
    .select("*", { count: "exact" })
    .eq("course_id", course_id)
    .order(options.orderBy || "created_at", {
      ascending: options.orderType === "asc",
    })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const rows = (data ?? []) as TestRow[];

  if (rows.length === 0) {
    return { documents: [], total: 0, hasMore: false };
  }

  const testIds = rows.map((t) => t.id);

  const [questions, subjects] = await Promise.all([
    fetchAllRows<QuestionRow>("questions", (q) => q.in("test_id", testIds)),
    fetchAllRows<TestSubjectRow>("test_subjects", (q) =>
      q.in("test_id", testIds),
    ),
  ]);

  const questionCountMap = new Map<string, number>();
  for (const q of questions) {
    questionCountMap.set(q.test_id, (questionCountMap.get(q.test_id) || 0) + 1);
  }

  const subjectCountMap = new Map<string, number>();
  for (const s of subjects) {
    subjectCountMap.set(s.test_id, (subjectCountMap.get(s.test_id) || 0) + 1);
  }

  const testsWithCounts = rows.map((test) => ({
    ...test,
    question_count: questionCountMap.get(test.id) || 0,
    subject_count: subjectCountMap.get(test.id) || 0,
  }));

  return {
    documents: testsWithCounts,
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + rows.length,
  };
}

export async function getPublishedTestsByCourse(
  course_id: string,
  options: QueryOptions = {},
): Promise<PaginatedResponse<TestRow & { question_count: number }>> {
  const limit = Math.min(options.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = options.offset || 0;

  const { data, error, count } = await supabase
    .from("tests")
    .select("*", { count: "exact" })
    .eq("course_id", course_id)
    .eq("is_published", true)
    .order(options.orderBy || "created_at", {
      ascending: options.orderType === "asc",
    })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const rows = (data ?? []) as TestRow[];

  if (rows.length === 0) {
    return { documents: [], total: 0, hasMore: false };
  }

  const testIds = rows.map((t) => t.id);
  const questions = await fetchAllRows<QuestionRow>("questions", (q) =>
    q.in("test_id", testIds),
  );

  const questionCountMap = new Map<string, number>();
  for (const q of questions) {
    questionCountMap.set(q.test_id, (questionCountMap.get(q.test_id) || 0) + 1);
  }

  const testsWithCounts = rows.map((test) => ({
    ...test,
    question_count: questionCountMap.get(test.id) || 0,
  }));

  return {
    documents: testsWithCounts,
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + rows.length,
  };
}

export async function getTestById(id: string): Promise<TestRow> {
  const { data, error } = await supabase
    .from("tests")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as TestRow;
}

export async function getTestWithSubjects(
  id: string,
): Promise<TestRow & { subjects: TestSubjectRow[] }> {
  const test = await getTestById(id);

  const { data, error } = await supabase
    .from("test_subjects")
    .select("*")
    .eq("test_id", id)
    .order("order", { ascending: true })
    .limit(100);

  if (error) throw error;

  return {
    ...test,
    subjects: (data ?? []) as TestSubjectRow[],
  };
}

export async function createTest(
  data: CreateTestInput,
  callingUserId: string,
): Promise<TestRow> {
  createTestInputSchema.parse(data);
  const course = await getCourseById(data.course_id);
  requireOwnership(course, callingUserId, "create tests for", "courses");

  const { data: row, error } = await supabase
    .from("tests")
    .insert({
      course_id: data.course_id,
      title: data.title,
      description: data.description,
      duration_minutes: data.duration_minutes,
      passing_score: data.passing_score,
      is_published: data.is_published ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  return row as TestRow;
}

export async function updateTest(
  id: string,
  data: UpdateTestInput,
  callingUserId: string,
): Promise<TestRow> {
  updateTestInputSchema.parse(data);
  const test = await getTestById(id);
  const course = await getCourseById(test.course_id);
  requireOwnership(course, callingUserId, "update tests for", "courses");

  const { data: row, error } = await supabase
    .from("tests")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return row as TestRow;
}

export async function deleteTest(
  id: string,
  callingUserId: string,
): Promise<void> {
  const test = await getTestById(id);
  const course = await getCourseById(test.course_id);
  requireOwnership(course, callingUserId, "delete tests for", "courses");

  // Cascade delete: subjects, questions, then test
  await supabase.from("test_subjects").delete().eq("test_id", id);
  await supabase.from("questions").delete().eq("test_id", id);

  const { error } = await supabase.from("tests").delete().eq("id", id);
  if (error) throw error;
}

export async function createTestSubject(
  data: {
    test_id: string;
    name: string;
    question_count: number;
    order: number;
  },
  callingUserId: string,
): Promise<TestSubjectRow> {
  const test = await getTestById(data.test_id);
  const course = await getCourseById(test.course_id);
  requireOwnership(course, callingUserId, "create subjects for", "courses");

  const { data: row, error } = await supabase
    .from("test_subjects")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return row as TestSubjectRow;
}

export async function updateTestSubject(
  id: string,
  data: Partial<{ name: string; question_count: number; order: number }>,
  test_id: string,
  callingUserId: string,
): Promise<TestSubjectRow> {
  const test = await getTestById(test_id);
  const course = await getCourseById(test.course_id);
  requireOwnership(course, callingUserId, "update subjects for", "courses");

  const { data: row, error } = await supabase
    .from("test_subjects")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return row as TestSubjectRow;
}

export async function deleteTestSubject(
  id: string,
  test_id: string,
  callingUserId: string,
): Promise<void> {
  const test = await getTestById(test_id);
  const course = await getCourseById(test.course_id);
  requireOwnership(course, callingUserId, "delete subjects for", "courses");

  const { error } = await supabase.from("test_subjects").delete().eq("id", id);
  if (error) throw error;
}

export async function getSubjectsByTest(
  test_id: string,
): Promise<TestSubjectRow[]> {
  const { data, error } = await supabase
    .from("test_subjects")
    .select("*")
    .eq("test_id", test_id)
    .order("order", { ascending: true })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as TestSubjectRow[];
}
