import { useAppwrite } from "@/hooks/use-appwrite";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

const Index = () => {
  const { currentUser, userProfile, loading } = useAppwrite();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (currentUser && userProfile) {
    // Redirect based on user role
    if (userProfile.role === "student") {
      return <Redirect href="/(student)/(tabs)/dashboard" />;
    } else {
      return <Redirect href="/(teacher)/(tabs)/dashboard" />;
    }
  }

  return <Redirect href="/(public)/welcome" />;
};

export default Index;
