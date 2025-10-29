export type UserRole = "teacher" | "student";

export interface UserProfile {
  $id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AppwriteUser {
  $id: string;
  email: string;
  name: string;
  emailVerification: boolean;
  prefs: Record<string, unknown>;
}
