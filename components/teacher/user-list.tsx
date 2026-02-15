import {
  getAllUsers,
  searchUsers,
  updateUserRole,
} from "@/lib/user-management";
import type { UserProfile, UserRole } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { UserCard } from "./user-card";

interface UserListProps {
  currentUserProfile: UserProfile;
}

type TabType = "teachers" | "tas" | "students";

/**
 * User list component with tabs, search, and role management
 */
export const UserList = ({ currentUserProfile }: UserListProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("teachers");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const queryClient = useQueryClient();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch all users
  const {
    data: allUsers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
  });

  // Search users based on debounced term
  const { data: searchResults } = useQuery({
    queryKey: ["users", "search", debouncedSearch],
    queryFn: () => searchUsers(debouncedSearch),
    enabled: debouncedSearch.length > 0,
  });

  // Mutation for updating user role
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: UserRole }) =>
      updateUserRole(userId, newRole, currentUserProfile),
    onSuccess: () => {
      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: ["users"] });
      Alert.alert("Success", "User role updated successfully");
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to update user role");
    },
  });

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    Alert.alert(
      "Confirm Role Change",
      "Are you sure you want to change this user's role?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: () => updateRoleMutation.mutate({ userId, newRole }),
        },
      ],
    );
  };

  // Filter users based on active tab and search
  const getFilteredUsers = (): UserProfile[] => {
    const usersToFilter =
      debouncedSearch.length > 0 ? searchResults || [] : allUsers;

    switch (activeTab) {
      case "teachers":
        return usersToFilter.filter((user) => user.role === "teacher");
      case "tas":
        return usersToFilter.filter(
          (user) => user.role === "teaching_assistant",
        );
      case "students":
        return usersToFilter.filter((user) => user.role === "student");
      default:
        return usersToFilter;
    }
  };

  const filteredUsers = getFilteredUsers();

  const renderTabButton = (tab: TabType, label: string) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        onPress={() => setActiveTab(tab)}
        className={`flex-1 py-3 border-b-2 ${
          isActive ? "border-primary-600" : "border-gray-200"
        }`}
        activeOpacity={0.7}
      >
        <Text
          className={`text-center font-semibold ${
            isActive ? "text-primary-600" : "text-gray-500"
          }`}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    const message =
      debouncedSearch.length > 0
        ? "No users found matching your search"
        : `No ${activeTab === "tas" ? "teaching assistants" : activeTab} found`;

    return (
      <View className="flex-1 items-center justify-center py-12">
        <Text className="text-gray-500 text-base">{message}</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-gray-600 mt-4">Loading users...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <Text className="text-red-600 text-base">Failed to load users</Text>
        <Text className="text-gray-500 text-sm mt-2">
          Please try again later
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Search Bar */}
      <View className="mb-4">
        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
          <Search size={20} color="#6b7280" />
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search by name or email..."
            placeholderTextColor="#9ca3af"
            className="flex-1 ml-3 text-base text-gray-900"
          />
        </View>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row mb-4">
        {renderTabButton("teachers", "Teachers")}
        {renderTabButton("tas", "TAs")}
        {renderTabButton("students", "Students")}
      </View>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            currentUserRole={currentUserProfile.role}
            currentUserId={currentUserProfile.$id}
            onRoleChange={handleRoleChange}
            isUpdating={updateRoleMutation.isPending}
          />
        )}
        ListEmptyComponent={renderEmptyState()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          filteredUsers.length === 0 ? { flex: 1 } : undefined
        }
      />
    </View>
  );
};
