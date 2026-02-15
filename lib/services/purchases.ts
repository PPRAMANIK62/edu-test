import { supabase } from "../supabase";
import { fetchAllRows } from "../supabase-helpers";
import { createPurchaseInputSchema } from "../schemas";
import { nowISO, DEFAULT_LIMIT, MAX_LIMIT, type QueryOptions } from "./helpers";
import type {
  CreatePurchaseInput,
  PaginatedResponse,
  PurchaseRow,
} from "./types";

export async function getPurchasesByStudent(
  student_id: string,
  options: QueryOptions = {},
): Promise<PaginatedResponse<PurchaseRow>> {
  const limit = Math.min(options.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = options.offset || 0;

  const { data, error, count } = await supabase
    .from("purchases")
    .select("*", { count: "exact" })
    .eq("student_id", student_id)
    .order("purchased_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const rows = (data ?? []) as PurchaseRow[];
  return {
    documents: rows,
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + rows.length,
  };
}

export async function getPurchasesByCourse(
  course_id: string,
  options: QueryOptions = {},
): Promise<PaginatedResponse<PurchaseRow>> {
  const limit = Math.min(options.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = options.offset || 0;

  const { data, error, count } = await supabase
    .from("purchases")
    .select("*", { count: "exact" })
    .eq("course_id", course_id)
    .order("purchased_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const rows = (data ?? []) as PurchaseRow[];
  return {
    documents: rows,
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + rows.length,
  };
}

export async function getPurchaseById(
  purchaseId: string,
): Promise<PurchaseRow | null> {
  const { data, error } = await supabase
    .from("purchases")
    .select("*")
    .eq("id", purchaseId)
    .maybeSingle();

  if (error) throw error;
  return data as PurchaseRow | null;
}

export async function hasStudentPurchased(
  student_id: string,
  course_id: string,
): Promise<boolean> {
  const { count, error } = await supabase
    .from("purchases")
    .select("*", { count: "exact", head: true })
    .eq("student_id", student_id)
    .eq("course_id", course_id);

  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function getPurchase(
  student_id: string,
  course_id: string,
): Promise<PurchaseRow | null> {
  const { data, error } = await supabase
    .from("purchases")
    .select("*")
    .eq("student_id", student_id)
    .eq("course_id", course_id)
    .maybeSingle();

  if (error) throw error;
  return data as PurchaseRow | null;
}

export async function createPurchase(
  input: CreatePurchaseInput,
): Promise<PurchaseRow> {
  createPurchaseInputSchema.parse(input);
  const existingPurchase = await getPurchase(input.student_id, input.course_id);
  if (existingPurchase) {
    throw new Error("Student has already purchased this course");
  }

  const now = nowISO();

  const { data, error } = await supabase
    .from("purchases")
    .insert({
      student_id: input.student_id,
      course_id: input.course_id,
      amount: input.amount,
      currency: input.currency || "INR",
      purchased_at: now,
      payment_status: "pending",
      payment_method: null,
      razorpay_order_id: null,
      razorpay_payment_id: null,
      razorpay_signature: null,
      webhook_verified: false,
      webhook_received_at: null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as PurchaseRow;
}

export async function getCourseRevenue(course_id: string): Promise<number> {
  const rows = await fetchAllRows<PurchaseRow>("purchases", (q) =>
    q.eq("course_id", course_id),
  );
  return rows.reduce((sum, purchase) => sum + purchase.amount, 0);
}

export async function getTeacherRevenue(
  courseIds: string[],
): Promise<{ total: number; byCourse: Record<string, number> }> {
  if (courseIds.length === 0) return { total: 0, byCourse: {} };

  const rows = await fetchAllRows<PurchaseRow>("purchases", (q) =>
    q.in("course_id", courseIds),
  );

  const byCourse: Record<string, number> = {};
  let total = 0;

  for (const purchase of rows) {
    byCourse[purchase.course_id] =
      (byCourse[purchase.course_id] || 0) + purchase.amount;
    total += purchase.amount;
  }

  return { total, byCourse };
}

export async function getPurchaseCount(course_id: string): Promise<number> {
  const { count, error } = await supabase
    .from("purchases")
    .select("*", { count: "exact", head: true })
    .eq("course_id", course_id);

  if (error) throw error;
  return count ?? 0;
}

export async function getRecentPurchases(
  courseIds?: string[],
  limit: number = 10,
): Promise<PurchaseRow[]> {
  let query = supabase
    .from("purchases")
    .select("*")
    .order("purchased_at", { ascending: false })
    .limit(limit);

  if (courseIds && courseIds.length > 0) {
    query = query.in("course_id", courseIds);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PurchaseRow[];
}
