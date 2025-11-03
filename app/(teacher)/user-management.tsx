import ScreenHeader from "@/components/teacher/screen-header";
import { UserList } from "@/components/teacher/user-list";
import { useAppwrite } from "@/hooks/use-appwrite";
import { isTeacher } from "@/lib/permissions";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * User Management screen for teachers to manage user roles
 * Only accessible to teachers with user management permissions
 */
export default function UserManagementScreen() {
  const { userProfile } = useAppwrite();

  // Redirect non-teachers
  useEffect(() => {
    if (userProfile && !isTeacher(userProfile.role)) {
      router.replace("/(teacher)/(tabs)/dashboard");
    }
  }, [userProfile]);

  if (!userProfile || !isTeacher(userProfile.role)) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "bottom"]}>
      <View className="flex-1">
        <ScreenHeader
          title="Manage Users"
          subtitle="Promote or demote users across roles"
        />

        {/* User List */}
        <View className="flex-1 px-6 pt-4">
          <UserList currentUserProfile={userProfile} />
        </View>
      </View>
    </SafeAreaView>
  );
}
