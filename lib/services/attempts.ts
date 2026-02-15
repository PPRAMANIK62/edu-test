import { supabase } from "../supabase";
import { fetchAllRows } from "../supabase-helpers";
import { startAttemptInputSchema } from "../schemas";
import { nowISO, DEFAULT_LIMIT, MAX_LIMIT, type QueryOptions } from "./helpers";
import { getTestById } from "./tests";
import type {
  Answer,
  PaginatedResponse,
  QuestionRow,
  TestAttemptRow,
} from "./types";

export async function getAttemptsByStudent(
  student_id: string,
  options: QueryOptions = {},
): Promise<PaginatedResponse<TestAttemptRow>> {
  const limit = Math.min(options.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = options.offset || 0;

  const { data, error, count } = await supabase
    .from("test_attempts")
    .select("*", { count: "exact" })
    .eq("student_id", student_id)
    .order("started_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const rows = (data ?? []) as TestAttemptRow[];
  return {
    documents: rows,
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + rows.length,
  };
}

export async function getAttemptsByTest(
  test_id: string,
  options: QueryOptions = {},
): Promise<PaginatedResponse<TestAttemptRow>> {
  const limit = Math.min(options.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = options.offset || 0;

  const { data, error, count } = await supabase
    .from("test_attempts")
    .select("*", { count: "exact" })
    .eq("test_id", test_id)
    .order("started_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const rows = (data ?? []) as TestAttemptRow[];
  return {
    documents: rows,
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + rows.length,
  };
}

export async function getCompletedAttemptsByTest(
  test_id: string,
  options: QueryOptions = {},
): Promise<PaginatedResponse<TestAttemptRow>> {
  const limit = Math.min(options.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = options.offset || 0;

  const { data, error, count } = await supabase
    .from("test_attempts")
    .select("*", { count: "exact" })
    .eq("test_id", test_id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const rows = (data ?? []) as TestAttemptRow[];
  return {
    documents: rows,
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + rows.length,
  };
}

export async function getAttemptById(
  attemptId: string,
): Promise<TestAttemptRow | null> {
  const { data, error } = await supabase
    .from("test_attempts")
    .select("*")
    .eq("id", attemptId)
    .maybeSingle();

  if (error) throw error;
  return data as TestAttemptRow | null;
}

// In Supabase, answers is jsonb — already parsed as Answer[]
export function getAnswersFromAttempt(attempt: TestAttemptRow): Answer[] {
  return attempt.answers ?? [];
}

export async function getInProgressAttempt(
  student_id: string,
  test_id: string,
): Promise<TestAttemptRow | null> {
  const { data, error } = await supabase
    .from("test_attempts")
    .select("*")
    .eq("student_id", student_id)
    .eq("test_id", test_id)
    .eq("status", "in_progress")
    .maybeSingle();

  if (error) throw error;
  return data as TestAttemptRow | null;
}

export async function getBestAttempt(
  student_id: string,
  test_id: string,
): Promise<TestAttemptRow | null> {
  const { data, error } = await supabase
    .from("test_attempts")
    .select("*")
    .eq("student_id", student_id)
    .eq("test_id", test_id)
    .eq("status", "completed")
    .order("percentage", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as TestAttemptRow | null;
}

export async function startAttempt(
  student_id: string,
  test_id: string,
  course_id: string,
): Promise<TestAttemptRow> {
  startAttemptInputSchema.parse({ student_id, test_id, course_id });
  const existingAttempt = await getInProgressAttempt(student_id, test_id);
  if (existingAttempt) return existingAttempt;

  const now = nowISO();

  const { data, error } = await supabase
    .from("test_attempts")
    .insert({
      student_id,
      test_id,
      course_id,
      started_at: now,
      completed_at: null,
      status: "in_progress",
      answers: [],
      score: null,
      percentage: null,
      passed: null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as TestAttemptRow;
}

export async function submitAnswer(
  attemptId: string,
  questionIndex: number,
  selectedIndex: number,
  isMarkedForReview: boolean = false,
): Promise<TestAttemptRow> {
  const attempt = await getAttemptById(attemptId);
  if (!attempt) throw new Error("Attempt not found");
  if (attempt.status !== "in_progress")
    throw new Error("Cannot submit answers to a completed attempt");

  const answers = getAnswersFromAttempt(attempt);
  const existingIndex = answers.findIndex((a) => a[0] === questionIndex);
  const newAnswer: Answer = [questionIndex, selectedIndex, isMarkedForReview];

  if (existingIndex >= 0) {
    answers[existingIndex] = newAnswer;
  } else {
    answers.push(newAnswer);
  }

  answers.sort((a, b) => a[0] - b[0]);

  // jsonb column — write Answer[] directly, no JSON.stringify needed
  const { data, error } = await supabase
    .from("test_attempts")
    .update({ answers })
    .eq("id", attemptId)
    .select()
    .single();

  if (error) throw error;
  return data as TestAttemptRow;
}

export async function submitAnswersBatch(
  attemptId: string,
  newAnswers: Answer[],
): Promise<TestAttemptRow> {
  const attempt = await getAttemptById(attemptId);
  if (!attempt) throw new Error("Attempt not found");
  if (attempt.status !== "in_progress")
    throw new Error("Cannot submit answers to a completed attempt");

  const answers = getAnswersFromAttempt(attempt);

  for (const newAnswer of newAnswers) {
    const existingIndex = answers.findIndex((a) => a[0] === newAnswer[0]);
    if (existingIndex >= 0) {
      answers[existingIndex] = newAnswer;
    } else {
      answers.push(newAnswer);
    }
  }

  answers.sort((a, b) => a[0] - b[0]);

  const { data, error } = await supabase
    .from("test_attempts")
    .update({ answers })
    .eq("id", attemptId)
    .select()
    .single();

  if (error) throw error;
  return data as TestAttemptRow;
}

export async function completeAttempt(
  attemptId: string,
): Promise<TestAttemptRow> {
  const attempt = await getAttemptById(attemptId);
  if (!attempt) throw new Error("Attempt not found");
  if (attempt.status === "completed") return attempt;

  const test = await getTestById(attempt.test_id);
  if (!test) throw new Error("Test not found");

  const questions = await fetchAllRows<QuestionRow>("questions", (q) =>
    q.eq("test_id", attempt.test_id).order("order", { ascending: true }),
  );

  const answers = getAnswersFromAttempt(attempt);
  const { score, percentage } = calculateScore(answers, questions);
  const passed = percentage >= test.passing_score;
  const now = nowISO();

  const { data, error } = await supabase
    .from("test_attempts")
    .update({
      completed_at: now,
      status: "completed",
      score,
      percentage,
      passed,
    })
    .eq("id", attemptId)
    .select()
    .single();

  if (error) throw error;
  return data as TestAttemptRow;
}

export async function expireAttempt(
  attemptId: string,
): Promise<TestAttemptRow> {
  const { data, error } = await supabase
    .from("test_attempts")
    .update({ status: "expired" })
    .eq("id", attemptId)
    .select()
    .single();

  if (error) throw error;
  return data as TestAttemptRow;
}

function calculateScore(
  answers: Answer[],
  questions: QuestionRow[],
): { score: number; percentage: number } {
  if (questions.length === 0) return { score: 0, percentage: 0 };

  let correctCount = 0;
  for (const answer of answers) {
    const [questionIndex, selectedIndex] = answer;
    const question = questions[questionIndex];
    if (question && question.correct_index === selectedIndex) {
      correctCount++;
    }
  }

  const percentage = Math.round((correctCount / questions.length) * 100);
  return { score: correctCount, percentage };
}

export async function getTestAttemptStats(test_id: string): Promise<{
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  passRate: number;
}> {
  const completedAttempts = await fetchAllRows<TestAttemptRow>(
    "test_attempts",
    (q) => q.eq("test_id", test_id).eq("status", "completed"),
  );

  const allResult = await getAttemptsByTest(test_id, { limit: 1 });

  if (completedAttempts.length === 0) {
    return {
      totalAttempts: allResult.total,
      completedAttempts: 0,
      averageScore: 0,
      passRate: 0,
    };
  }

  const totalScore = completedAttempts.reduce(
    (sum, a) => sum + (a.percentage || 0),
    0,
  );
  const passedCount = completedAttempts.filter((a) => a.passed).length;

  return {
    totalAttempts: allResult.total,
    completedAttempts: completedAttempts.length,
    averageScore: Math.round(totalScore / completedAttempts.length),
    passRate: Math.round((passedCount / completedAttempts.length) * 100),
  };
}

export async function getStudentTestHistory(
  student_id: string,
  test_id: string,
  options: QueryOptions = {},
): Promise<PaginatedResponse<TestAttemptRow>> {
  const limit = Math.min(options.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = options.offset || 0;

  const { data, error, count } = await supabase
    .from("test_attempts")
    .select("*", { count: "exact" })
    .eq("student_id", student_id)
    .eq("test_id", test_id)
    .order("started_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const rows = (data ?? []) as TestAttemptRow[];
  return {
    documents: rows,
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + rows.length,
  };
}
