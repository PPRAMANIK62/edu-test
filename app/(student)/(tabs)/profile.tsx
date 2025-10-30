import { useAppwrite } from "@/providers/appwrite";
import { useRouter } from "expo-router";
import {
  Award,
  BookOpen,
  LogOut,
  Mail,
  Settings,
  User,
} from "lucide-react-native";
import React from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ProfileTab = () => {
  const { userProfile: user, signOut } = useAppwrite();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSignOut = () => {
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
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-4" style={{ paddingTop: insets.top + 24 }}>
          <Text className="text-3xl font-bold text-gray-900 mb-2">Profile</Text>
          <Text className="text-base text-gray-600">
            Manage your account and settings
          </Text>
        </View>

        <View className="px-6 mb-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <View className="items-center mb-6">
              <View className="bg-primary-100 rounded-full w-24 h-24 items-center justify-center mb-4">
                <User size={48} color="#1890ff" />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-1">
                {user?.firstName} {user?.lastName}
              </Text>
              <View className="flex-row items-center">
                <Mail size={16} color="#6b7280" />
                <Text className="text-sm text-gray-600 ml-2">
                  {user?.email}
                </Text>
              </View>
            </View>

            <View className="border-t border-gray-100 pt-4">
              <View className="flex-row items-center justify-around">
                <View className="items-center">
                  <View className="bg-blue-50 rounded-full p-3 mb-2">
                    <BookOpen size={24} color="#1890ff" />
                  </View>
                  <Text className="text-2xl font-bold text-gray-900">2</Text>
                  <Text className="text-sm text-gray-600">Courses</Text>
                </View>
                <View className="items-center">
                  <View className="bg-green-50 rounded-full p-3 mb-2">
                    <Award size={24} color="#38a169" />
                  </View>
                  <Text className="text-2xl font-bold text-gray-900">5</Text>
                  <Text className="text-sm text-gray-600">Tests Done</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className="px-6 mb-6">
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Settings
          </Text>
          <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <TouchableOpacity
              activeOpacity={0.7}
              className="flex-row items-center p-4 border-b border-gray-100"
            >
              <View className="bg-gray-100 rounded-full p-2 mr-3">
                <Settings size={20} color="#6b7280" />
              </View>
              <Text className="flex-1 text-gray-900 font-medium">
                Account Settings
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-6 mb-8">
          <TouchableOpacity
            onPress={handleSignOut}
            activeOpacity={0.7}
            className="bg-white rounded-2xl p-4 flex-row items-center shadow-sm border border-red-100"
          >
            <View className="bg-red-50 rounded-full p-2 mr-3">
              <LogOut size={20} color="#e53e3e" />
            </View>
            <Text className="flex-1 text-red-600 font-semibold">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileTab;
