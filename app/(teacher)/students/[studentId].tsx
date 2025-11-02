import ScreenHeader from "@/components/teacher/screen-header";
import {
  MOCK_STUDENT_ENROLLMENTS,
  MOCK_STUDENT_TEST_ATTEMPTS,
  MOCK_STUDENTS,
} from "@/lib/mockdata";
import { formatTimeAgo } from "@/lib/utils";
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
import React from "react";
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

  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ["student", studentId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return MOCK_STUDENTS.find((s) => s.id === studentId);
    },
  });

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["student-enrollments", studentId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return MOCK_STUDENT_ENROLLMENTS.filter((e) => e.studentId === studentId);
    },
  });

  const { data: testAttempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ["student-test-attempts", studentId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return MOCK_STUDENT_TEST_ATTEMPTS.filter(
        (a) => a.studentId === studentId
      ).slice(0, 5);
    },
  });

  const isLoading = studentLoading || enrollmentsLoading || attemptsLoading;

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

  if (!student) {
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
                  {student.name.charAt(0)}
                </Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-1">
                {student.name}
              </Text>
              <View className="flex-row items-center mb-2">
                <Mail size={16} color="#6b7280" />
                <Text className="text-sm text-gray-600 ml-2">
                  {student.email}
                </Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full ${
                  student.status === "active" ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    student.status === "active"
                      ? "text-green-700"
                      : "text-gray-600"
                  }`}
                >
                  {student.status.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Stats */}
            <View className="border-t border-gray-100 pt-4">
              <View className="flex-row items-center justify-around">
                <StatItem
                  icon={<BookOpen size={24} color="#7c3aed" />}
                  value={student.enrolledCourses}
                  label="Courses"
                  bgColor="bg-violet-50"
                />
                <StatItem
                  icon={<Award size={24} color="#10b981" />}
                  value={student.completedTests}
                  label="Tests Done"
                  bgColor="bg-green-50"
                />
                <StatItem
                  icon={<Target size={24} color="#f59e0b" />}
                  value={`${student.averageScore}%`}
                  label="Avg Score"
                  bgColor="bg-amber-50"
                />
                <StatItem
                  icon={<DollarSign size={24} color="#3b82f6" />}
                  value={`$${student.totalSpent}`}
                  label="Spent"
                  bgColor="bg-blue-50"
                />
              </View>
            </View>

            <View className="border-t border-gray-100 mt-4 pt-4">
              <View className="flex-row items-center">
                <Calendar size={16} color="#6b7280" />
                <Text className="text-sm text-gray-600 ml-2">
                  Last active {formatTimeAgo(student.lastActive)}
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
                      Enrolled {formatTimeAgo(enrollment.enrolledAt)}
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
                          {formatTimeAgo(attempt.completedAt)}
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
