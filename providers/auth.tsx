import { supabase } from "@/lib/supabase";
import type { SupabaseUser, UserProfile, UserRole } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface AuthContextType {
  currentUser: SupabaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    first_name: string,
    last_name: string,
    role: UserRole,
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Fetch user profile from profiles table
 */
async function fetchProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      role: data.role,
      is_primary_teacher: data.is_primary_teacher ?? false,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Refresh current user and profile
  const refreshUser = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        const profile = await fetchProfile(session.user.id);
        setUserProfile(profile);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      setCurrentUser(null);
      setUserProfile(null);
    }
  }, []);

  // Sign up
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      first_name: string,
      last_name: string,
      role: UserRole,
    ) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { first_name, last_name, role },
          },
        });

        if (error) {
          if (error.message?.includes("already registered")) {
            throw new Error("Email already registered");
          }
          throw new Error(error.message || "Sign up failed. Please try again.");
        }

        if (!data.user) {
          throw new Error("Sign up failed. Please try again.");
        }

        // Insert profile row
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          email,
          first_name,
          last_name,
          role,
          is_primary_teacher: false,
        });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          // Don't throw — auth account was created, profile can be retried
        }

        setCurrentUser(data.user);
        setUserProfile({
          id: data.user.id,
          email,
          first_name,
          last_name,
          role,
          is_primary_teacher: false,
        });
      } catch (error: unknown) {
        console.error("Sign up error:", error);
        if (error instanceof Error) throw error;
        throw new Error("Sign up failed. Please try again.");
      }
    },
    [],
  );

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message?.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password");
        }
        throw new Error(error.message || "Sign in failed. Please try again.");
      }

      if (!data.user) {
        throw new Error("Sign in failed. Please try again.");
      }

      setCurrentUser(data.user);

      const profile = await fetchProfile(data.user.id);
      if (!profile) {
        throw new Error("User profile not found");
      }
      setUserProfile(profile);
    } catch (error: unknown) {
      console.error("Sign in error:", error);
      if (error instanceof Error) throw error;
      throw new Error("Sign in failed. Please try again.");
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setCurrentUser(null);
      setUserProfile(null);
      queryClient.clear();
    }
  }, [queryClient]);

  // Listen to auth state changes + restore session on mount
  useEffect(() => {
    // Restore session on mount
    const restoreSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setCurrentUser(session.user);
          const profile = await fetchProfile(session.user.id);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error("Session restoration error:", error);
        setCurrentUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();

    // Subscribe to auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setCurrentUser(session.user);
        const profile = await fetchProfile(session.user.id);
        setUserProfile(profile);
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null);
        setUserProfile(null);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        setCurrentUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = useMemo(
    () => ({
      currentUser,
      userProfile,
      loading,
      signUp,
      signIn,
      signOut,
      refreshUser,
    }),
    [currentUser, userProfile, loading, signUp, signIn, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
