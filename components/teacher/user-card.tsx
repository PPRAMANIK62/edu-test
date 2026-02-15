import type { UserProfile, UserRole } from "@/types";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface UserCardProps {
  user: UserProfile;
  currentUserRole: UserRole;
  currentUserId: string;
  onRoleChange: (userId: string, newRole: UserRole) => void;
  isUpdating?: boolean;
}

/**
 * Card component to display individual user information with role management actions
 */
export const UserCard = ({
  user,
  currentUserRole,
  currentUserId,
  onRoleChange,
  isUpdating = false,
}: UserCardProps) => {
  const [showActions, setShowActions] = useState(false);

  const isCurrentUser = user.id === currentUserId;

  // Determine available role actions based on current role
  const getAvailableActions = (): UserRole[] => {
    const actions: UserRole[] = [];

    // Prevent user from changing their own role
    if (isCurrentUser) {
      return actions;
    }

    if (user.role === "student") {
      actions.push("teaching_assistant", "teacher");
    } else if (user.role === "teaching_assistant") {
      actions.push("student", "teacher");
    } else if (user.role === "teacher" && !user.is_primary_teacher) {
      actions.push("student", "teaching_assistant");
    }

    return actions;
  };

  const availableActions = getAvailableActions();
  const canManage =
    currentUserRole === "teacher" && availableActions.length > 0;

  const getRoleActionLabel = (role: UserRole): string => {
    switch (role) {
      case "teacher":
        return "Promote to Teacher";
      case "teaching_assistant":
        return user.role === "teacher" ? "Demote to TA" : "Promote to TA";
      case "student":
        return "Demote to Student";
      default:
        return role;
    }
  };

  return (
    <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900 mb-1">
            {user.first_name} {user.last_name}
          </Text>
          <Text className="text-sm text-gray-600">{user.email}</Text>
        </View>

        {canManage && (
          <TouchableOpacity
            onPress={() => setShowActions(!showActions)}
            className="ml-3 p-2"
            disabled={isUpdating}
            activeOpacity={0.7}
          >
            {showActions ? (
              <ChevronUp size={20} color="#6b7280" />
            ) : (
              <ChevronDown size={20} color="#6b7280" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {showActions && canManage && (
        <View className="mt-3 pt-3 border-t border-gray-200">
          <Text className="text-xs font-medium text-gray-700 mb-2">
            Change Role:
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {availableActions.map((action) => (
              <TouchableOpacity
                key={action}
                onPress={() => {
                  onRoleChange(user.id, action);
                  setShowActions(false);
                }}
                disabled={isUpdating}
                className={`px-3 py-2 rounded-lg border ${
                  isUpdating
                    ? "bg-gray-100 border-gray-300"
                    : "bg-primary-50 border-primary-300"
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-sm font-medium ${
                    isUpdating ? "text-gray-500" : "text-primary-700"
                  }`}
                >
                  {getRoleActionLabel(action)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {user.is_primary_teacher && (
        <View className="mt-3 pt-3 border-t border-gray-200">
          <Text className="text-xs text-gray-500 italic">
            Primary teacher cannot be demoted
          </Text>
        </View>
      )}

      {isCurrentUser && !user.is_primary_teacher && (
        <View className="mt-3 pt-3 border-t border-gray-200">
          <Text className="text-xs text-gray-500 italic">
            You cannot change your own role
          </Text>
        </View>
      )}
    </View>
  );
};
