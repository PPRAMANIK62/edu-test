import ScreenHeader from "@/components/teacher/screen-header";
import { useAttemptsByStudent } from "@/hooks/use-attempts";
import { useEnrollmentsByStudent } from "@/hooks/use-enrollments";
import { supabase } from "@/lib/supabase";
import { formatTimeAgo } from "@/lib/utils";
import { useAuth } from "@/providers/auth";
import type { ProfileRow } from "@/lib/services/types";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  DollarSign,
  Mail,
  Target,
  XCircle,
} from "lucide-react-native";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const StudentDetail = () => {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const { userProfile } = useAuth();

  const isTeacher = userProfile?.role === "teacher";

  // Fetch student profile from database
  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ["student", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentId)
        .single();
      if (error) throw error;
      return data as ProfileRow;
    },
    enabled: !!studentId,
  });

  // Fetch enrollments from database
  const { data: enrollmentsData, isLoading: enrollmentsLoading } =
    useEnrollmentsByStudent(studentId);

  // Fetch test attempts from database
  const { data: attemptsData, isLoading: attemptsLoading } =
    useAttemptsByStudent(studentId);

  // Transform enrollments for display
  const enrollments = useMemo(() => {
    if (!enrollmentsData?.documents) return [];

    return enrollmentsData.documents.map((e) => ({
      id: e.id,
      studentId: e.student_id,
      courseId: e.course_id,
      courseTitle: e.course_id.substring(0, 20) + "...", // Would need course lookup
      enrolled_at: e.enrolled_at,
      progress: e.progress,
      status: e.status as "active" | "completed",
    }));
  }, [enrollmentsData]);

  // Transform and filter recent test attempts
  const testAttempts = useMemo(() => {
    if (!attemptsData?.documents) return [];

    return attemptsData.documents
      .filter((a) => a.status === "completed")
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        studentId: a.student_id,
        testId: a.test_id,
        testTitle: a.test_id.substring(0, 20) + "...", // Would need test lookup
        score: a.score || 0,
        percentage: a.percentage || 0,
        completed_at: a.completed_at || a.started_at,
        passed: a.passed || false,
      }));
  }, [attemptsData]);

  // Compute student stats
  const studentStats = useMemo(() => {
    const enrolledCourses = enrollmentsData?.total || 0;
    const completedTests =
      attemptsData?.documents.filter((a) => a.status === "completed").length ||
      0;
    const averageScore =
      completedTests > 0
        ? Math.round(
            testAttempts.reduce((sum, a) => sum + a.percentage, 0) /
              completedTests,
          )
        : 0;

    return {
      enrolledCourses,
      completedTests,
      averageScore,
      totalSpent: 0, // Would come from purchases
    };
  }, [enrollmentsData, attemptsData, testAttempts]);

  const isLoading = studentLoading || enrollmentsLoading || attemptsLoading;

  // Transform student for display
  const studentDisplay = student
    ? {
        name: `${student.first_name} ${student.last_name}`,
        email: student.email,
        status: "active" as const,
        lastActive: student.created_at || new Date().toISOString(),
        ...studentStats,
      }
    : null;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <ScreenHeader title="Student Details" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      </SafeAreaView>
    );
  }

  if (!studentDisplay) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <ScreenHeader title="Student Details" />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-900 font-bold text-xl mb-2">
            Student Not Found
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            The student you&apos;re looking for doesn&apos;t exist.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-violet-600 rounded-xl px-6 py-3"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <ScreenHeader title="Student Details" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          {/* Student Profile Card */}
          <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <View className="items-center mb-6">
              <View className="bg-violet-100 rounded-full w-24 h-24 items-center justify-center mb-4">
                <Text className="text-violet-700 font-bold text-3xl">
                  {studentDisplay.name.charAt(0)}
                </Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-1">
                {studentDisplay.name}
              </Text>
              <View className="flex-row items-center mb-2">
                <Mail size={16} color="#6b7280" />
                <Text className="text-sm text-gray-600 ml-2">
                  {studentDisplay.email}
                </Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full ${
                  studentDisplay.status === "active"
                    ? "bg-green-100"
                    : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    studentDisplay.status === "active"
                      ? "text-green-700"
                      : "text-gray-600"
                  }`}
                >
                  {studentDisplay.status.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Stats */}
            <View className="border-t border-gray-100 pt-4">
              <View className="flex-row items-center justify-around">
                <StatItem
                  icon={<BookOpen size={24} color="#7c3aed" />}
                  value={studentDisplay.enrolledCourses}
                  label="Courses"
                  bgColor="bg-violet-50"
                />
                <StatItem
                  icon={<Award size={24} color="#10b981" />}
                  value={studentDisplay.completedTests}
                  label="Tests Done"
                  bgColor="bg-green-50"
                />
                <StatItem
                  icon={<Target size={24} color="#f59e0b" />}
                  value={`${studentDisplay.averageScore}%`}
                  label="Avg Score"
                  bgColor="bg-amber-50"
                />
                {isTeacher && (
                  <StatItem
                    icon={<DollarSign size={24} color="#3b82f6" />}
                    value={`$${studentDisplay.totalSpent}`}
                    label="Spent"
                    bgColor="bg-blue-50"
                  />
                )}
              </View>
            </View>

            <View className="border-t border-gray-100 mt-4 pt-4">
              <View className="flex-row items-center">
                <Calendar size={16} color="#6b7280" />
                <Text className="text-sm text-gray-600 ml-2">
                  Last active {formatTimeAgo(studentDisplay.lastActive)}
                </Text>
              </View>
            </View>
          </View>

          {/* Enrollments Section */}
          {enrollments && enrollments.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-3">
                Enrolled Courses ({enrollments.length})
              </Text>
              <View className="gap-3">
                {enrollments.map((enrollment) => (
                  <View
                    key={enrollment.id}
                    className="bg-white rounded-2xl p-4 shadow-sm"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <Text className="text-base font-bold text-gray-900 flex-1">
                        {enrollment.courseTitle}
                      </Text>
                      <View
                        className={`px-2 py-1 rounded-full ${
                          enrollment.status === "active"
                            ? "bg-green-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            enrollment.status === "active"
                              ? "text-green-700"
                              : "text-gray-600"
                          }`}
                        >
                          {enrollment.status}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm text-gray-500 mb-3">
                      Enrolled {formatTimeAgo(enrollment.enrolled_at)}
                    </Text>
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-sm font-semibold text-gray-700">
                        Progress
                      </Text>
                      <Text className="text-sm font-bold text-violet-600">
                        {enrollment.progress}%
                      </Text>
                    </View>
                    <View className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <View
                        className="bg-violet-600 h-full rounded-full"
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Test Attempts Section */}
          {testAttempts && testAttempts.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-3">
                Recent Tests (Last 5)
              </Text>
              <View className="gap-3">
                {testAttempts.map((attempt) => (
                  <View
                    key={attempt.id}
                    className="bg-white rounded-2xl p-4 shadow-sm"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-base font-bold text-gray-900 mb-1">
                          {attempt.testTitle}
                        </Text>
                        <Text className="text-sm text-gray-500">
                          {formatTimeAgo(attempt.completed_at)}
                        </Text>
                      </View>
                      <View className="items-end">
                        {attempt.passed ? (
                          <View className="flex-row items-center">
                            <CheckCircle size={20} color="#10b981" />
                            <Text className="text-green-600 font-bold ml-1">
                              Passed
                            </Text>
                          </View>
                        ) : (
                          <View className="flex-row items-center">
                            <XCircle size={20} color="#ef4444" />
                            <Text className="text-red-600 font-bold ml-1">
                              Failed
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                      <Text className="text-sm text-gray-600">Score</Text>
                      <Text className="text-lg font-bold text-gray-900">
                        {attempt.score} ({attempt.percentage}%)
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {(!enrollments || enrollments.length === 0) &&
            (!testAttempts || testAttempts.length === 0) && (
              <View className="bg-white rounded-2xl p-6 items-center">
                <Text className="text-gray-600 text-center">
                  No enrollment or test data available for this student.
                </Text>
              </View>
            )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const StatItem = ({
  icon,
  value,
  label,
  bgColor,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  bgColor: string;
}) => {
  return (
    <View className="items-center">
      <View className={`${bgColor} rounded-full p-3 mb-2`}>{icon}</View>
      <Text className="text-xl font-bold text-gray-900">{value}</Text>
      <Text className="text-xs text-gray-600">{label}</Text>
    </View>
  );
};

export default StudentDetail;
