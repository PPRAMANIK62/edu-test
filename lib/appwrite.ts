import { Account, Client, TablesDB } from "appwrite";
import Constants from "expo-constants";

// Helper to get env variable from expo config or process.env
const getEnvVar = (key: string): string | undefined => {
  return Constants.expoConfig?.extra?.[key] || process.env[key];
};

// Get environment variables
export const APPWRITE_CONFIG = {
  endpoint: getEnvVar("EXPO_PUBLIC_APPWRITE_ENDPOINT"),
  projectId: getEnvVar("EXPO_PUBLIC_APPWRITE_PROJECT_ID"),
  databaseId: getEnvVar("EXPO_PUBLIC_APPWRITE_DATABASE_ID"),
  tables: {
    users: getEnvVar("EXPO_PUBLIC_APPWRITE_USERS_TABLE_ID"),
    courses: getEnvVar("EXPO_PUBLIC_APPWRITE_COURSES_TABLE_ID"),
    tests: getEnvVar("EXPO_PUBLIC_APPWRITE_TESTS_TABLE_ID"),
    testSubjects: getEnvVar("EXPO_PUBLIC_APPWRITE_TEST_SUBJECTS_TABLE_ID"),
    questions: getEnvVar("EXPO_PUBLIC_APPWRITE_QUESTIONS_TABLE_ID"),
    enrollments: getEnvVar("EXPO_PUBLIC_APPWRITE_ENROLLMENTS_TABLE_ID"),
    purchases: getEnvVar("EXPO_PUBLIC_APPWRITE_PURCHASES_TABLE_ID"),
    testAttempts: getEnvVar("EXPO_PUBLIC_APPWRITE_TEST_ATTEMPTS_TABLE_ID"),
    activities: getEnvVar("EXPO_PUBLIC_APPWRITE_ACTIVITIES_TABLE_ID"),
  },
};

// Validate required environment variables
const requiredVars = [
  { key: "endpoint", value: APPWRITE_CONFIG.endpoint },
  { key: "projectId", value: APPWRITE_CONFIG.projectId },
];

const missingVars = requiredVars.filter((v) => !v.value).map((v) => v.key);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required Appwrite environment variables: ${missingVars.join(", ")}. Please check your .env file.`
  );
}

// Validate table IDs (warn but don't throw - allows gradual migration)
const validateTableIds = () => {
  const tableEntries = Object.entries(APPWRITE_CONFIG.tables);
  const missingTables = tableEntries
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingTables.length > 0) {
    console.warn(
      `[Appwrite] Missing table IDs: ${missingTables.join(", ")}. Some features may not work.`
    );
  }
};

validateTableIds();

// Initialize Appwrite Client
const client = new Client();

client
  .setEndpoint(APPWRITE_CONFIG.endpoint!)
  .setProject(APPWRITE_CONFIG.projectId!);

// Initialize services
export const account = new Account(client);
export const databases = new TablesDB(client);

export { client };
