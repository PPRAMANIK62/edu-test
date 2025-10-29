import { useAppwrite } from "@/hooks/use-appwrite";
import { useRouter } from "expo-router";
import { LogOut } from "lucide-react-native";
import React from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Dashboard = () => {
  const router = useRouter();
  const { userProfile, signOut } = useAppwrite();

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(public)/welcome");
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="flex-1 px-6 pt-6">
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-3xl font-bold text-gray-900">
              Teacher Dashboard
            </Text>
            {userProfile && (
              <Text className="text-lg text-gray-600 mt-1">
                Welcome, {userProfile.firstName}!
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-red-50 p-3 rounded-xl"
            activeOpacity={0.7}
          >
            <LogOut size={24} color="#dc2626" />
          </TouchableOpacity>
        </View>

        <View className="bg-primary-50 p-6 rounded-2xl mb-6">
          <Text className="text-xl font-semibold text-primary-900 mb-2">
            Manage Your Classes
          </Text>
          <Text className="text-primary-700">
            Create courses, track student progress, and manage content.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Dashboard;
