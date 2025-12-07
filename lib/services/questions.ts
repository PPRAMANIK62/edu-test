/**
 * Question Service - CRUD operations for questions
 */

import { ID, Query } from "appwrite";
import { APPWRITE_CONFIG, databases } from "../appwrite";
import { buildQueries, type QueryOptions } from "./helpers";
import type {
  CreateQuestionInput,
  PaginatedResponse,
  QuestionDocument,
  UpdateQuestionInput,
} from "./types";

const { databaseId, tables } = APPWRITE_CONFIG;

/**
 * Get questions for a test
 */
export async function getQuestionsByTest(
  testId: string,
  options: QueryOptions = {}
): Promise<PaginatedResponse<QuestionDocument>> {
  const queries = [
    Query.equal("testId", testId),
    ...buildQueries({ ...options, orderBy: options.orderBy || "order" }),
  ];

  const response = await databases.listRows<QuestionDocument>({
    databaseId: databaseId!,
    tableId: tables.questions!,
    queries,
  });

  return {
    documents: response.rows as QuestionDocument[],
    total: response.total,
    hasMore: response.total > (options.offset || 0) + response.rows.length,
  };
}

/**
 * Get questions for a test by subject
 */
export async function getQuestionsBySubject(
  testId: string,
  subjectId: string,
  options: QueryOptions = {}
): Promise<PaginatedResponse<QuestionDocument>> {
  const queries = [
    Query.equal("testId", testId),
    Query.equal("subjectId", subjectId),
    ...buildQueries({ ...options, orderBy: options.orderBy || "order" }),
  ];

  const response = await databases.listRows<QuestionDocument>({
    databaseId: databaseId!,
    tableId: tables.questions!,
    queries,
  });

  return {
    documents: response.rows as QuestionDocument[],
    total: response.total,
    hasMore: response.total > (options.offset || 0) + response.rows.length,
  };
}

/**
 * Get a single question by ID
 */
export async function getQuestionById(id: string): Promise<QuestionDocument> {
  const response = await databases.getRow<QuestionDocument>({
    databaseId: databaseId!,
    tableId: tables.questions!,
    rowId: id,
  });

  return response as QuestionDocument;
}

/**
 * Create a new question
 */
export async function createQuestion(
  data: CreateQuestionInput
): Promise<QuestionDocument> {
  const response = await databases.createRow<QuestionDocument>({
    databaseId: databaseId!,
    tableId: tables.questions!,
    rowId: ID.unique(),
    data: {
      testId: data.testId,
      subjectId: data.subjectId,
      subjectName: data.subjectName,
      type: data.type || "mcq",
      text: data.text,
      options: data.options,
      correctIndex: data.correctIndex,
      explanation: data.explanation,
      order: data.order,
    },
  });

  return response as QuestionDocument;
}

/**
 * Update an existing question
 */
export async function updateQuestion(
  id: string,
  data: UpdateQuestionInput
): Promise<QuestionDocument> {
  const response = await databases.updateRow<QuestionDocument>({
    databaseId: databaseId!,
    tableId: tables.questions!,
    rowId: id,
    data,
  });

  return response as QuestionDocument;
}

/**
 * Delete a question
 */
export async function deleteQuestion(id: string): Promise<void> {
  await databases.deleteRow({
    databaseId: databaseId!,
    tableId: tables.questions!,
    rowId: id,
  });
}

/**
 * Reorder questions in a test
 * @param testId - Test ID
 * @param questionIds - Array of question IDs in desired order
 */
export async function reorderQuestions(
  testId: string,
  questionIds: string[]
): Promise<void> {
  // Update each question with its new order
  const updates = questionIds.map((questionId, index) =>
    databases.updateRow({
      databaseId: databaseId!,
      tableId: tables.questions!,
      rowId: questionId,
      data: { order: index + 1 },
    })
  );

  await Promise.all(updates);
}

/**
 * Get question count for a test
 */
export async function getQuestionCount(testId: string): Promise<number> {
  const response = await databases.listRows({
    databaseId: databaseId!,
    tableId: tables.questions!,
    queries: [Query.equal("testId", testId), Query.limit(1)],
  });

  return response.total;
}

/**
 * Bulk create questions for a test
 */
export async function bulkCreateQuestions(
  questions: CreateQuestionInput[]
): Promise<QuestionDocument[]> {
  const created = await Promise.all(
    questions.map((data) =>
      databases.createRow<QuestionDocument>({
        databaseId: databaseId!,
        tableId: tables.questions!,
        rowId: ID.unique(),
        data: {
          testId: data.testId,
          subjectId: data.subjectId,
          subjectName: data.subjectName,
          type: data.type || "mcq",
          text: data.text,
          options: data.options,
          correctIndex: data.correctIndex,
          explanation: data.explanation,
          order: data.order,
        },
      })
    )
  );

  return created as QuestionDocument[];
}
