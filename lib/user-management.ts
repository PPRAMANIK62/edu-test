import { APPWRITE_CONFIG } from "@/lib/appwrite";
import {
  fetchAllRows,
  typedListRows,
  typedUpdateRow,
} from "@/lib/appwrite-helpers";
import type { UserProfile, UserRole } from "@/types";
import { Query } from "appwrite";

/**
 * User management functions for fetching and updating user data
 */

/**
 * Fetch all users from the database
 * @returns Array of user profiles
 */
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const response = await fetchAllRows<UserProfile>(
      APPWRITE_CONFIG.tables.users!,
    );

    return response.rows || [];
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw new Error("Failed to fetch users");
  }
};

/**
 * Fetch users filtered by role
 * @param role - The role to filter by
 * @returns Array of user profiles matching the role
 */
export const getUsersByRole = async (
  role: UserRole,
): Promise<UserProfile[]> => {
  try {
    const response = await fetchAllRows<UserProfile>(
      APPWRITE_CONFIG.tables.users!,
      [Query.equal("role", role)],
    );

    return response.rows || [];
  } catch (error) {
    console.error(`Error fetching users with role ${role}:`, error);
    throw new Error(`Failed to fetch users with role ${role}`);
  }
};

/**
 * Search users by name or email
 * @param searchTerm - The search term to match against name or email
 * @returns Array of user profiles matching the search term
 */
export const searchUsers = async (
  searchTerm: string,
): Promise<UserProfile[]> => {
  try {
    if (!searchTerm.trim()) {
      return await getAllUsers();
    }

    const response = await fetchAllRows<UserProfile>(
      APPWRITE_CONFIG.tables.users!,
    );

    const allUsers = response.rows || [];

    // Client-side filtering for name and email
    const searchLower = searchTerm.toLowerCase();
    return allUsers.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const email = user.email.toLowerCase();
      return fullName.includes(searchLower) || email.includes(searchLower);
    });
  } catch (error) {
    console.error("Error searching users:", error);
    throw new Error("Failed to search users");
  }
};

/**
 * Update a user's role
 * @param userId - The ID of the user to update
 * @param newRole - The new role to assign
 * @param currentUserProfile - The profile of the user making the change (for validation)
 * @returns Updated user profile
 */
export const updateUserRole = async (
  userId: string,
  newRole: UserRole,
  currentUserProfile: UserProfile,
): Promise<UserProfile> => {
  try {
    // Validation: Only teachers can update roles
    if (currentUserProfile.role !== "teacher") {
      throw new Error("Only teachers can update user roles");
    }

    // Fetch the user being updated
    const userResponse = await typedListRows<UserProfile>(
      APPWRITE_CONFIG.tables.users!,
      [Query.equal("$id", userId)],
    );

    if (!userResponse.rows || userResponse.rows.length === 0) {
      throw new Error("User not found");
    }

    const targetUser = userResponse.rows[0];

    // Validation: Cannot demote primary teacher
    if (targetUser.isPrimaryTeacher && newRole !== "teacher") {
      throw new Error("Cannot demote the primary teacher");
    }

    // Update the user's role
    const updatedUser = await typedUpdateRow<UserProfile>(
      APPWRITE_CONFIG.tables.users!,
      userId,
      { role: newRole },
    );

    return updatedUser;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error updating user role:", error.message);
      throw error;
    }
    console.error("Error updating user role:", error);
    throw new Error("Failed to update user role");
  }
};

/**
 * Get multiple users by IDs (batch fetch)
 * @param userIds - Array of user IDs to fetch
 * @returns Map of user ID to user name
 */
export const getUserNamesByIds = async (
  userIds: string[],
): Promise<Map<string, string>> => {
  const result = new Map<string, string>();

  if (userIds.length === 0) {
    return result;
  }

  try {
    const response = await typedListRows<UserProfile>(
      APPWRITE_CONFIG.tables.users!,
      [Query.equal("$id", userIds), Query.limit(100)],
    );

    response.rows.forEach((user) => {
      result.set(user.$id, `${user.firstName} ${user.lastName}`);
    });

    return result;
  } catch (error) {
    console.error("Error fetching users by IDs:", error);
    return result;
  }
};
