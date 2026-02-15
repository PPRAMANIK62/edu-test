import { supabase } from "../supabase";
import {
  createQuestionInputSchema,
  updateQuestionInputSchema,
} from "../schemas";
import { getCourseById } from "./courses";
import {
  requireOwnership,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  type QueryOptions,
} from "./helpers";
import { getTestById } from "./tests";
import type {
  CreateQuestionInput,
  PaginatedResponse,
  QuestionRow,
  UpdateQuestionInput,
} from "./types";

export async function getQuestionsByTest(
  test_id: string,
  options: QueryOptions = {},
): Promise<PaginatedResponse<QuestionRow>> {
  const limit = Math.min(options.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = options.offset || 0;

  const { data, error, count } = await supabase
    .from("questions")
    .select("*", { count: "exact" })
    .eq("test_id", test_id)
    .order(options.orderBy || "order", {
      ascending: options.orderType !== "desc",
    })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const rows = (data ?? []) as QuestionRow[];

  return {
    documents: rows,
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + rows.length,
  };
}

export async function getQuestionsBySubject(
  test_id: string,
  subject_id: string,
  options: QueryOptions = {},
): Promise<PaginatedResponse<QuestionRow>> {
  const limit = Math.min(options.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = options.offset || 0;

  const { data, error, count } = await supabase
    .from("questions")
    .select("*", { count: "exact" })
    .eq("test_id", test_id)
    .eq("subject_id", subject_id)
    .order(options.orderBy || "order", {
      ascending: options.orderType !== "desc",
    })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const rows = (data ?? []) as QuestionRow[];

  return {
    documents: rows,
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + rows.length,
  };
}

export async function getQuestionById(id: string): Promise<QuestionRow> {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as QuestionRow;
}

export async function createQuestion(
  data: CreateQuestionInput,
  callingUserId: string,
): Promise<QuestionRow> {
  createQuestionInputSchema.parse(data);
  const test = await getTestById(data.test_id);
  const course = await getCourseById(test.course_id);
  requireOwnership(course, callingUserId, "create questions for", "courses");

  const { data: row, error } = await supabase
    .from("questions")
    .insert({
      test_id: data.test_id,
      subject_id: data.subject_id,
      subject_name: data.subject_name,
      type: data.type || "mcq",
      text: data.text,
      options: data.options,
      correct_index: data.correct_index,
      explanation: data.explanation,
      order: data.order,
    })
    .select()
    .single();

  if (error) throw error;
  return row as QuestionRow;
}

export async function updateQuestion(
  id: string,
  data: UpdateQuestionInput,
  callingUserId: string,
): Promise<QuestionRow> {
  updateQuestionInputSchema.parse(data);
  const question = await getQuestionById(id);
  const test = await getTestById(question.test_id);
  const course = await getCourseById(test.course_id);
  requireOwnership(course, callingUserId, "update questions for", "courses");

  const { data: row, error } = await supabase
    .from("questions")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return row as QuestionRow;
}

export async function deleteQuestion(
  id: string,
  callingUserId: string,
): Promise<void> {
  const question = await getQuestionById(id);
  const test = await getTestById(question.test_id);
  const course = await getCourseById(test.course_id);
  requireOwnership(course, callingUserId, "delete questions for", "courses");

  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderQuestions(
  test_id: string,
  questionIds: string[],
  callingUserId: string,
): Promise<void> {
  const test = await getTestById(test_id);
  const course = await getCourseById(test.course_id);
  requireOwnership(course, callingUserId, "reorder questions for", "courses");

  const updates = questionIds.map((questionId, index) =>
    supabase
      .from("questions")
      .update({ order: index + 1 })
      .eq("id", questionId),
  );

  await Promise.all(updates);
}

export async function getQuestionCount(test_id: string): Promise<number> {
  const { count, error } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("test_id", test_id);

  if (error) throw error;
  return count ?? 0;
}

export async function bulkCreateQuestions(
  questions: CreateQuestionInput[],
  callingUserId: string,
): Promise<QuestionRow[]> {
  if (questions.length > 0) {
    const test = await getTestById(questions[0].test_id);
    const course = await getCourseById(test.course_id);
    requireOwnership(course, callingUserId, "create questions for", "courses");
  }

  const rows = questions.map((data) => ({
    test_id: data.test_id,
    subject_id: data.subject_id,
    subject_name: data.subject_name,
    type: data.type || "mcq",
    text: data.text,
    options: data.options,
    correct_index: data.correct_index,
    explanation: data.explanation,
    order: data.order,
  }));

  const { data, error } = await supabase
    .from("questions")
    .insert(rows)
    .select();

  if (error) throw error;
  return (data ?? []) as QuestionRow[];
}
