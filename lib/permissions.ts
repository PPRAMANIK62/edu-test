import type { UserRole } from "@/types";

/**
 * Permission helper functions for role-based access control
 */

/**
 * Check if user is a teacher
 * @param role - User role
 * @returns true if user role is "teacher"
 */
export const isTeacher = (role: UserRole): boolean => {
  return role === "teacher";
};

/**
 * Check if user is a teaching assistant
 * @param role - User role
 * @returns true if user role is "teaching_assistant"
 */
export const isTA = (role: UserRole): boolean => {
  return role === "teaching_assistant";
};
