import { account, APPWRITE_CONFIG, databases } from "@/lib/appwrite";
import type { AppwriteUser, UserProfile, UserRole } from "@/types";
import { Query } from "appwrite";
import * as SecureStore from "expo-secure-store";
import { useQueryClient } from "@tanstack/react-query";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// Validate environment variables
if (!APPWRITE_CONFIG.tables.users) {
  throw new Error(
    "Missing Appwrite database configuration. Please check your .env file."
  );
}

// Session storage key
const SESSION_KEY = "appwrite_session";

interface AppwriteContextType {
  currentUser: AppwriteUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AppwriteContext = createContext<AppwriteContextType | undefined>(
  undefined
);

export const AppwriteProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<AppwriteUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // SecureStore helper functions with error handling
  const saveSession = async (sessionId: string) => {
    try {
      await SecureStore.setItemAsync(SESSION_KEY, sessionId);
    } catch (error) {
      console.error("SecureStore error (save):", error);
      // Fallback: continue without persisting session
    }
  };

  const getSession = async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(SESSION_KEY);
    } catch (error) {
      console.error("SecureStore error (get):", error);
      return null;
    }
  };

  const clearSession = async () => {
    try {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    } catch (error) {
      console.error("SecureStore error (clear):", error);
      // Continue even if clearing fails
    }
  };

  // Fetch user profile from database
  const fetchUserProfile = async (
    userId: string
  ): Promise<UserProfile | null> => {
    try {
      const response = await databases.listRows({
        databaseId: APPWRITE_CONFIG.databaseId!,
        tableId: APPWRITE_CONFIG.tables.users!,
        queries: [Query.equal("$id", userId)],
      });

      // listRows returns an object with a 'rows' array
      if (response.rows && response.rows.length > 0) {
        return response.rows[0] as unknown as UserProfile;
      }

      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  // Refresh current user and profile
  const refreshUser = useCallback(async () => {
    try {
      const user = await account.get();
      setCurrentUser(user as unknown as AppwriteUser);

      const profile = await fetchUserProfile(user.$id);
      setUserProfile(profile);
    } catch (error) {
      console.error("Error refreshing user:", error);
      setCurrentUser(null);
      setUserProfile(null);
    }
  }, []);

  // Sign up function
  const signUp = useCallback(async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole
  ) => {
    try {
      // Create Appwrite user account
      const user = await account.create(
        "unique()",
        email,
        password,
        `${firstName} ${lastName}`
      );

      // Create user profile in database
      await databases.createRow({
        databaseId: APPWRITE_CONFIG.databaseId!,
        tableId: APPWRITE_CONFIG.tables.users!,
        rowId: user.$id,
        data: {
          email,
          firstName,
          lastName,
          role,
        },
      });

      // Create session
      const session = await account.createEmailPasswordSession(email, password);
      await saveSession(session.$id);

      // Set current user and profile
      setCurrentUser(user as unknown as AppwriteUser);
      setUserProfile({
        $id: user.$id,
        email,
        firstName,
        lastName,
        role,
      });
    } catch (error: any) {
      console.error("Sign up error:", error);

      if (error.code === 409) {
        throw new Error("Email already registered");
      } else if (error.code === 400) {
        throw new Error("Invalid email or password format");
      } else if (error.type === "user_already_exists") {
        throw new Error("Email already registered");
      }

      throw new Error(error.message || "Sign up failed. Please try again.");
    }
  }, []);

  // Sign in function
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      // Delete any existing session first
      try {
        await account.deleteSession("current");
      } catch {
        // Ignore error if no session exists
      }

      // Create session
      const session = await account.createEmailPasswordSession(email, password);
      await saveSession(session.$id);

      // Get current user
      const user = await account.get();
      setCurrentUser(user as unknown as AppwriteUser);

      // Fetch user profile
      const profile = await fetchUserProfile(user.$id);
      if (!profile) {
        throw new Error("User profile not found");
      }
      setUserProfile(profile);
    } catch (error: any) {
      console.error("Sign in error:", error);

      if (error.code === 401) {
        throw new Error("Invalid email or password");
      } else if (error.type === "user_invalid_credentials") {
        throw new Error("Invalid email or password");
      } else if (error.type === "user_not_found") {
        throw new Error("Account not found");
      }

      throw new Error(error.message || "Sign in failed. Please try again.");
    }
  }, []);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      await account.deleteSession("current");
    } catch (error) {
      console.error("Sign out error:", error);
      // Continue with local cleanup even if API call fails
    } finally {
      await clearSession();
      setCurrentUser(null);
      setUserProfile(null);
      queryClient.clear();
    }
  }, [queryClient]);

  // Restore session on app startup
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const sessionId = await getSession();

        if (sessionId) {
          // Try to get current user
          const user = await account.get();
          setCurrentUser(user as unknown as AppwriteUser);

          // Fetch user profile
          const profile = await fetchUserProfile(user.$id);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error("Session restoration error:", error);
        // Clear invalid session
        await clearSession();
        setCurrentUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const value: AppwriteContextType = useMemo(
    () => ({
      currentUser,
      userProfile,
      loading,
      signUp,
      signIn,
      signOut,
      refreshUser,
    }),
    [currentUser, userProfile, loading, signUp, signIn, signOut, refreshUser]
  );

  return (
    <AppwriteContext.Provider value={value}>
      {children}
    </AppwriteContext.Provider>
  );
};

export const useAppwrite = () => {
  const context = useContext(AppwriteContext);
  if (context === undefined) {
    throw new Error("useAppwrite must be used within AppwriteProvider");
  }
  return context;
};
