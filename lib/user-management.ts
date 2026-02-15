import { supabase } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/supabase-helpers";
import type { UserProfile, UserRole } from "@/types";
import type { ProfileRow } from "@/lib/services/types";

function toUserProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    first_name: row.first_name,
    last_name: row.last_name,
    role: row.role,
    is_primary_teacher: row.is_primary_teacher,
  };
}

export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const rows = await fetchAllRows<ProfileRow>("profiles");
    return rows.map(toUserProfile);
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw new Error("Failed to fetch users");
  }
};

export const getUsersByRole = async (
  role: UserRole,
): Promise<UserProfile[]> => {
  try {
    const rows = await fetchAllRows<ProfileRow>("profiles", (q) =>
      q.eq("role", role),
    );
    return rows.map(toUserProfile);
  } catch (error) {
    console.error(`Error fetching users with role ${role}:`, error);
    throw new Error(`Failed to fetch users with role ${role}`);
  }
};

export const searchUsers = async (
  searchTerm: string,
): Promise<UserProfile[]> => {
  try {
    if (!searchTerm.trim()) {
      return await getAllUsers();
    }

    const allUsers = await getAllUsers();
    const searchLower = searchTerm.toLowerCase();
    return allUsers.filter((user) => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const email = user.email.toLowerCase();
      return fullName.includes(searchLower) || email.includes(searchLower);
    });
  } catch (error) {
    console.error("Error searching users:", error);
    throw new Error("Failed to search users");
  }
};

export const updateUserRole = async (
  userId: string,
  newRole: UserRole,
  currentUserProfile: UserProfile,
): Promise<UserProfile> => {
  try {
    if (currentUserProfile.role !== "teacher") {
      throw new Error("Only teachers can update user roles");
    }

    const { data: targetUser, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError || !targetUser) {
      throw new Error("User not found");
    }

    if (targetUser.is_primary_teacher && newRole !== "teacher") {
      throw new Error("Cannot demote the primary teacher");
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return toUserProfile(data as ProfileRow);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error updating user role:", error.message);
      throw error;
    }
    console.error("Error updating user role:", error);
    throw new Error("Failed to update user role");
  }
};

export const getUserNamesByIds = async (
  userIds: string[],
): Promise<Map<string, string>> => {
  const result = new Map<string, string>();
  if (userIds.length === 0) return result;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", userIds)
      .limit(100);

    if (error) throw error;

    (data ?? []).forEach((user) => {
      result.set(user.id, `${user.first_name} ${user.last_name}`);
    });

    return result;
  } catch (error) {
    console.error("Error fetching users by IDs:", error);
    return result;
  }
};
