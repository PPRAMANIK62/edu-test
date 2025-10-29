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
  },
};

// Validate required environment variables
if (!APPWRITE_CONFIG.endpoint || !APPWRITE_CONFIG.projectId) {
  throw new Error(
    "Missing required Appwrite environment variables. Please check your .env file."
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
