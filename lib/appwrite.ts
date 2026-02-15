import { Account, Client, TablesDB } from "appwrite";
import Constants from "expo-constants";

// Get environment variables
export const APPWRITE_CONFIG = {
  endpoint:
    Constants.expoConfig?.extra?.EXPO_PUBLIC_APPWRITE_ENDPOINT ||
    process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId:
    Constants.expoConfig?.extra?.EXPO_PUBLIC_APPWRITE_PROJECT_ID ||
    process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId:
    Constants.expoConfig?.extra?.EXPO_PUBLIC_APPWRITE_DATABASE_ID ||
    process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  tables: {
    users:
      Constants.expoConfig?.extra?.EXPO_PUBLIC_APPWRITE_USERS_TABLE_ID ||
      process.env.EXPO_PUBLIC_APPWRITE_USERS_TABLE_ID,
    courses:
      Constants.expoConfig?.extra?.EXPO_PUBLIC_APPWRITE_COURSES_TABLE_ID ||
      process.env.EXPO_PUBLIC_APPWRITE_COURSES_TABLE_ID,
    tests:
      Constants.expoConfig?.extra?.EXPO_PUBLIC_APPWRITE_TESTS_TABLE_ID ||
      process.env.EXPO_PUBLIC_APPWRITE_TESTS_TABLE_ID,
    testSubjects:
      Constants.expoConfig?.extra
        ?.EXPO_PUBLIC_APPWRITE_TEST_SUBJECTS_TABLE_ID ||
      process.env.EXPO_PUBLIC_APPWRITE_TEST_SUBJECTS_TABLE_ID,
    questions:
      Constants.expoConfig?.extra?.EXPO_PUBLIC_APPWRITE_QUESTIONS_TABLE_ID ||
      process.env.EXPO_PUBLIC_APPWRITE_QUESTIONS_TABLE_ID,
    enrollments:
      Constants.expoConfig?.extra?.EXPO_PUBLIC_APPWRITE_ENROLLMENTS_TABLE_ID ||
      process.env.EXPO_PUBLIC_APPWRITE_ENROLLMENTS_TABLE_ID,
    purchases:
      Constants.expoConfig?.extra?.EXPO_PUBLIC_APPWRITE_PURCHASES_TABLE_ID ||
      process.env.EXPO_PUBLIC_APPWRITE_PURCHASES_TABLE_ID,
    testAttempts:
      Constants.expoConfig?.extra
        ?.EXPO_PUBLIC_APPWRITE_TEST_ATTEMPTS_TABLE_ID ||
      process.env.EXPO_PUBLIC_APPWRITE_TEST_ATTEMPTS_TABLE_ID,
    activities:
      Constants.expoConfig?.extra?.EXPO_PUBLIC_APPWRITE_ACTIVITIES_TABLE_ID ||
      process.env.EXPO_PUBLIC_APPWRITE_ACTIVITIES_TABLE_ID,
  },
};

// Validate required environment variables
if (!APPWRITE_CONFIG.endpoint || !APPWRITE_CONFIG.projectId) {
  throw new Error(
    `Missing required Appwrite environment variables: endpoint, projectId. Please check your .env file.`,
  );
}

// Initialize Appwrite Client
const client = new Client();

client
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId);

// Initialize services
export const account = new Account(client);
export const databases = new TablesDB(client);

export { client };
