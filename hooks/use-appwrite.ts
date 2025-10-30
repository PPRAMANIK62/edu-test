import { useAppwrite as useAppwriteContext } from "@/providers/appwrite";

export { useAppwriteContext as useAppwrite };

// Additional convenience hooks can be added here
export const useAuth = () => {
  const { currentUser, loading, signIn, signOut, signUp } =
    useAppwriteContext();
  return {
    user: currentUser,
    isAuthenticated: !!currentUser,
    loading,
    signIn,
    signOut,
    signUp,
  };
};

export const useUser = () => {
  const { currentUser, userProfile, loading } = useAppwriteContext();
  return {
    user: currentUser,
    profile: userProfile,
    loading,
    isAuthenticated: !!currentUser,
  };
};
