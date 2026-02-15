/**
 * Test Service - CRUD operations for tests
 */

import { ID, Query } from "appwrite";
import { APPWRITE_CONFIG, databases } from "../appwrite";
import { typedListRows } from "../appwrite-helpers";
import { getCourseById } from "./courses";
import { buildQueries, type QueryOptions } from "./helpers";
import type {
  CreateTestInput,
  PaginatedResponse,
  QuestionDocument,
  TestDocument,
  TestSubjectDocument,
  UpdateTestInput,
} from "./types";

const { databaseId, tables } = APPWRITE_CONFIG;

/**
 * Get tests for a course
 */
export async function getTestsByCourse(
  courseId: string,
  options: QueryOptions = {},
): Promise<
  PaginatedResponse<
    TestDocument & { questionCount: number; subjectCount: number }
  >
> {
  const queries = [
    Query.equal("courseId", courseId),
    ...buildQueries({ ...options, orderBy: options.orderBy || "$createdAt" }),
  ];

  const response = await databases.listRows<TestDocument>({
    databaseId: databaseId!,
    tableId: tables.tests!,
    queries,
  });

  const documents = response.rows as TestDocument[];

  if (documents.length === 0) {
    return { documents: [], total: 0, hasMore: false };
  }

  // Get test IDs
  const testIds = documents.map((t) => t.$id);

  // Fetch question counts
  const questionResponse = await typedListRows<QuestionDocument>(
    tables.questions!,
    [Query.equal("testId", testIds), Query.limit(1000)],
  );

  // Fetch subject counts
  const subjectResponse = await typedListRows<TestSubjectDocument>(
    tables.testSubjects!,
    [Query.equal("testId", testIds), Query.limit(1000)],
  );

  // Build question count map
  const questionCountMap = new Map<string, number>();
  for (const question of questionResponse.rows) {
    questionCountMap.set(
      question.testId,
      (questionCountMap.get(question.testId) || 0) + 1,
    );
  }

  // Build subject count map
  const subjectCountMap = new Map<string, number>();
  for (const subject of subjectResponse.rows) {
    subjectCountMap.set(
      subject.testId,
      (subjectCountMap.get(subject.testId) || 0) + 1,
    );
  }

  // Merge counts with tests
  const testsWithCounts = documents.map((test) => ({
    ...test,
    questionCount: questionCountMap.get(test.$id) || 0,
    subjectCount: subjectCountMap.get(test.$id) || 0,
  }));

  return {
    documents: testsWithCounts,
    total: response.total,
    hasMore: response.total > (options.offset || 0) + documents.length,
  };
}

/**
 * Get published tests for a course (student view)
 * Includes question count for each test
 */
export async function getPublishedTestsByCourse(
  courseId: string,
  options: QueryOptions = {},
): Promise<PaginatedResponse<TestDocument & { questionCount: number }>> {
  const queries = [
    Query.equal("courseId", courseId),
    Query.equal("isPublished", true),
    ...buildQueries({ ...options, orderBy: options.orderBy || "$createdAt" }),
  ];

  const response = await databases.listRows<TestDocument>({
    databaseId: databaseId!,
    tableId: tables.tests!,
    queries,
  });

  const documents = response.rows as TestDocument[];

  if (documents.length === 0) {
    return { documents: [], total: 0, hasMore: false };
  }

  // Get test IDs and fetch question counts
  const testIds = documents.map((t) => t.$id);
  const questionResponse = await typedListRows<QuestionDocument>(
    tables.questions!,
    [Query.equal("testId", testIds), Query.limit(1000)],
  );

  // Build question count map
  const questionCountMap = new Map<string, number>();
  for (const question of questionResponse.rows) {
    questionCountMap.set(
      question.testId,
      (questionCountMap.get(question.testId) || 0) + 1,
    );
  }

  // Merge question counts with tests
  const testsWithCounts = documents.map((test) => ({
    ...test,
    questionCount: questionCountMap.get(test.$id) || 0,
  }));

  return {
    documents: testsWithCounts,
    total: response.total,
    hasMore: response.total > (options.offset || 0) + documents.length,
  };
}

/**
 * Get a single test by ID
 */
export async function getTestById(id: string): Promise<TestDocument> {
  const response = await databases.getRow<TestDocument>({
    databaseId: databaseId!,
    tableId: tables.tests!,
    rowId: id,
  });

  return response as TestDocument;
}

/**
 * Get test with subjects
 */
export async function getTestWithSubjects(
  id: string,
): Promise<TestDocument & { subjects: TestSubjectDocument[] }> {
  const test = await getTestById(id);

  const subjectsResponse = await databases.listRows<TestSubjectDocument>({
    databaseId: databaseId!,
    tableId: tables.testSubjects!,
    queries: [
      Query.equal("testId", id),
      Query.orderAsc("order"),
      Query.limit(100),
    ],
  });

  return {
    ...test,
    subjects: subjectsResponse.rows as TestSubjectDocument[],
  };
}

/**
 * Create a new test
 */
export async function createTest(
  data: CreateTestInput,
  callingUserId: string,
): Promise<TestDocument> {
  const course = await getCourseById(data.courseId);
  if (course.teacherId !== callingUserId) {
    throw new Error(
      "Forbidden: You can only create tests for your own courses",
    );
  }

  const response = await databases.createRow<TestDocument>({
    databaseId: databaseId!,
    tableId: tables.tests!,
    rowId: ID.unique(),
    data: {
      courseId: data.courseId,
      title: data.title,
      description: data.description,
      durationMinutes: data.durationMinutes,
      passingScore: data.passingScore,
      isPublished: data.isPublished ?? false,
    },
  });

  return response as TestDocument;
}

/**
 * Update an existing test
 */
export async function updateTest(
  id: string,
  data: UpdateTestInput,
  callingUserId: string,
): Promise<TestDocument> {
  const test = await getTestById(id);
  const course = await getCourseById(test.courseId);
  if (course.teacherId !== callingUserId) {
    throw new Error(
      "Forbidden: You can only update tests for your own courses",
    );
  }

  const response = await databases.updateRow<TestDocument>({
    databaseId: databaseId!,
    tableId: tables.tests!,
    rowId: id,
    data,
  });

  return response as TestDocument;
}

/**
 * Delete a test (and its subjects and questions)
 */
export async function deleteTest(
  id: string,
  callingUserId: string,
): Promise<void> {
  const test = await getTestById(id);
  const course = await getCourseById(test.courseId);
  if (course.teacherId !== callingUserId) {
    throw new Error(
      "Forbidden: You can only delete tests for your own courses",
    );
  }

  // Delete associated subjects
  const subjectsResponse = await databases.listRows({
    databaseId: databaseId!,
    tableId: tables.testSubjects!,
    queries: [Query.equal("testId", id), Query.limit(100)],
  });

  for (const subject of subjectsResponse.rows) {
    await databases.deleteRow({
      databaseId: databaseId!,
      tableId: tables.testSubjects!,
      rowId: subject.$id,
    });
  }

  // Delete associated questions
  const questionsResponse = await databases.listRows({
    databaseId: databaseId!,
    tableId: tables.questions!,
    queries: [Query.equal("testId", id), Query.limit(500)],
  });

  for (const question of questionsResponse.rows) {
    await databases.deleteRow({
      databaseId: databaseId!,
      tableId: tables.questions!,
      rowId: question.$id,
    });
  }

  // Delete the test
  await databases.deleteRow({
    databaseId: databaseId!,
    tableId: tables.tests!,
    rowId: id,
  });
}

/**
 * Create a test subject
 */
export async function createTestSubject(
  data: {
    testId: string;
    name: string;
    questionCount: number;
    order: number;
  },
  callingUserId: string,
): Promise<TestSubjectDocument> {
  const test = await getTestById(data.testId);
  const course = await getCourseById(test.courseId);
  if (course.teacherId !== callingUserId) {
    throw new Error(
      "Forbidden: You can only create subjects for your own courses",
    );
  }

  const response = await databases.createRow<TestSubjectDocument>({
    databaseId: databaseId!,
    tableId: tables.testSubjects!,
    rowId: ID.unique(),
    data,
  });

  return response as TestSubjectDocument;
}

/**
 * Update a test subject
 */
export async function updateTestSubject(
  id: string,
  data: Partial<{ name: string; questionCount: number; order: number }>,
  testId: string,
  callingUserId: string,
): Promise<TestSubjectDocument> {
  const test = await getTestById(testId);
  const course = await getCourseById(test.courseId);
  if (course.teacherId !== callingUserId) {
    throw new Error(
      "Forbidden: You can only update subjects for your own courses",
    );
  }

  const response = await databases.updateRow<TestSubjectDocument>({
    databaseId: databaseId!,
    tableId: tables.testSubjects!,
    rowId: id,
    data,
  });

  return response as TestSubjectDocument;
}

/**
 * Delete a test subject
 */
export async function deleteTestSubject(
  id: string,
  testId: string,
  callingUserId: string,
): Promise<void> {
  const test = await getTestById(testId);
  const course = await getCourseById(test.courseId);
  if (course.teacherId !== callingUserId) {
    throw new Error(
      "Forbidden: You can only delete subjects for your own courses",
    );
  }

  await databases.deleteRow({
    databaseId: databaseId!,
    tableId: tables.testSubjects!,
    rowId: id,
  });
}

/**
 * Get subjects for a test
 */
export async function getSubjectsByTest(
  testId: string,
): Promise<TestSubjectDocument[]> {
  const response = await databases.listRows<TestSubjectDocument>({
    databaseId: databaseId!,
    tableId: tables.testSubjects!,
    queries: [
      Query.equal("testId", testId),
      Query.orderAsc("order"),
      Query.limit(100),
    ],
  });

  return response.rows as TestSubjectDocument[];
}
