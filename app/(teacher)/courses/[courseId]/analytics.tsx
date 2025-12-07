import ScreenHeader from "@/components/teacher/screen-header";
import StatCard from "@/components/teacher/stat-card";
import TimeRangeSelector from "@/components/teacher/time-range-selector";
import { useAppwrite } from "@/hooks/use-appwrite";
import { useCourseWithStats } from "@/hooks/use-courses";
import {
  useCoursePerformance,
  useStudentEngagement,
} from "@/hooks/use-teacher-analytics";
import { isTeacher } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";
import { TimeRangeFilter } from "@/types";
import { useLocalSearchParams } from "expo-router";
import {
  ArrowDown,
  ArrowUp,
  Award,
  BookOpen,
  DollarSign,
  Target,
  TrendingUp,
  Users,
} from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CourseAnalytics = () => {
  const insets = useSafeAreaInsets();
  const { userProfile } = useAppwrite();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>("30d");

  // Check if user can view revenue
  const showRevenue = userProfile ? isTeacher(userProfile.role) : false;

  // Fetch course details from database
  const { data: courseData, isLoading: isLoadingCourse } =
    useCourseWithStats(courseId);

  // Fetch analytics data
  const {
    data: performanceData,
    isLoading: isLoadingPerformance,
    error: performanceError,
  } = useCoursePerformance(courseId || "", timeRange);

  const {
    data: engagementData,
    isLoading: isLoadingEngagement,
    error: engagementError,
  } = useStudentEngagement(courseId || "");

  const isLoading =
    isLoadingCourse || isLoadingPerformance || isLoadingEngagement;
  const error = performanceError || engagementError;

  // Transform course data to expected format
  const course = courseData
    ? {
        id: courseData.$id,
        title: courseData.title,
        totalTests: courseData.testCount,
        totalQuestions: courseData.questionCount,
        estimatedHours: courseData.estimatedHours,
        price: courseData.price,
        enrollmentCount: courseData.enrollmentCount,
      }
    : null;

  if (!course && !isLoadingCourse) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-600 text-lg">Course not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <ScreenHeader title="Course Analytics" subtitle={course?.title} />

        {/* Time Range Selector */}
        <View className="px-6 pb-4">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </View>
        {/* Loading State */}
        {isLoading && (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#7c3aed" />
            <Text className="text-gray-600 mt-4">Loading analytics...</Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View className="mx-6 mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
            <Text className="text-red-900 font-semibold mb-1">
              Error Loading Analytics
            </Text>
            <Text className="text-red-700 text-sm">
              {error instanceof Error
                ? error.message
                : "Failed to load analytics data"}
            </Text>
          </View>
        )}

        {/* Analytics Content */}
        {!isLoading && !error && performanceData && engagementData && (
          <>
            {/* Key Metrics */}
            <View className="px-6 mb-6">
              <View className="flex-row flex-wrap gap-3">
                {/* Revenue - only visible to teachers */}
                {showRevenue && (
                  <StatCard
                    icon={<DollarSign size={20} color="#10b981" />}
                    label="Revenue"
                    value={formatCurrency(performanceData.totalRevenue)}
                    bgColor="bg-emerald-50"
                    iconBgColor="bg-emerald-100"
                  />
                )}

                {/* Non-revenue metrics - visible to all */}
                <StatCard
                  icon={<Users size={20} color="#0ea5e9" />}
                  label="Enrollments"
                  value={performanceData.totalEnrollments.toString()}
                  bgColor="bg-sky-50"
                  iconBgColor="bg-sky-100"
                />
                <StatCard
                  icon={<Award size={20} color="#f59e0b" />}
                  label="Avg Rating"
                  value={performanceData.averageRating.toFixed(1)}
                  bgColor="bg-amber-50"
                  iconBgColor="bg-amber-100"
                />
                <StatCard
                  icon={<Target size={20} color="#7c3aed" />}
                  label="Completion"
                  value={`${performanceData.completionRate.toFixed(0)}%`}
                  bgColor="bg-violet-50"
                  iconBgColor="bg-violet-100"
                />
              </View>
            </View>

            {/* Performance Trends */}
            {((showRevenue && performanceData.trends.revenueChange !== 0) ||
              performanceData.trends.enrollmentChange !== 0) && (
              <View className="px-6 mb-6">
                <Text className="text-lg font-bold text-gray-900 mb-3">
                  Trends
                </Text>
                <View className="bg-white rounded-2xl p-4 shadow-sm">
                  {/* Revenue change - only visible to teachers */}
                  {showRevenue &&
                    performanceData.trends.revenueChange !== 0 && (
                      <View
                        className={`flex-row items-center justify-between py-3 ${performanceData.trends.enrollmentChange !== 0 ? "border-b border-gray-100" : ""}`}
                      >
                        <Text className="text-gray-700 font-medium">
                          Revenue Change
                        </Text>
                        <View className="flex-row items-center gap-1">
                          {performanceData.trends.revenueChange >= 0 ? (
                            <ArrowUp size={16} color="#10b981" />
                          ) : (
                            <ArrowDown size={16} color="#ef4444" />
                          )}
                          <Text
                            className={`font-bold ${performanceData.trends.revenueChange >= 0 ? "text-emerald-600" : "text-red-600"}`}
                          >
                            {Math.abs(
                              performanceData.trends.revenueChange
                            ).toFixed(1)}
                            %
                          </Text>
                        </View>
                      </View>
                    )}
                  {performanceData.trends.enrollmentChange !== 0 && (
                    <View className="flex-row items-center justify-between py-3">
                      <Text className="text-gray-700 font-medium">
                        Enrollment Change
                      </Text>
                      <View className="flex-row items-center gap-1">
                        {performanceData.trends.enrollmentChange >= 0 ? (
                          <ArrowUp size={16} color="#10b981" />
                        ) : (
                          <ArrowDown size={16} color="#ef4444" />
                        )}
                        <Text
                          className={`font-bold ${performanceData.trends.enrollmentChange >= 0 ? "text-emerald-600" : "text-red-600"}`}
                        >
                          {Math.abs(
                            performanceData.trends.enrollmentChange
                          ).toFixed(1)}
                          %
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Student Engagement Section */}
            <View className="px-6 mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-3">
                Student Engagement
              </Text>

              <View className="bg-white rounded-2xl p-4 shadow-sm gap-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View className="bg-sky-50 rounded-full p-2">
                      <Users size={18} color="#0ea5e9" />
                    </View>
                    <Text className="text-gray-700 font-medium">
                      Total Students
                    </Text>
                  </View>
                  <Text className="text-gray-900 font-bold text-lg">
                    {engagementData.totalStudents}
                  </Text>
                </View>

                <View className="h-px bg-gray-100" />

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View className="bg-emerald-50 rounded-full p-2">
                      <TrendingUp size={18} color="#10b981" />
                    </View>
                    <Text className="text-gray-700 font-medium">
                      Active Students
                    </Text>
                  </View>
                  <Text className="text-gray-900 font-bold text-lg">
                    {engagementData.activeStudents}
                  </Text>
                </View>

                <View className="h-px bg-gray-100" />

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View className="bg-violet-50 rounded-full p-2">
                      <BookOpen size={18} color="#7c3aed" />
                    </View>
                    <Text className="text-gray-700 font-medium">
                      Test Attempts
                    </Text>
                  </View>
                  <Text className="text-gray-900 font-bold text-lg">
                    {engagementData.totalTestAttempts}
                  </Text>
                </View>

                <View className="h-px bg-gray-100" />

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View className="bg-amber-50 rounded-full p-2">
                      <Award size={18} color="#f59e0b" />
                    </View>
                    <Text className="text-gray-700 font-medium">
                      Average Score
                    </Text>
                  </View>
                  <Text className="text-gray-900 font-bold text-lg">
                    {engagementData.averageTestScore.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Course Details */}
            <View className="px-6 pb-8">
              <Text className="text-lg font-bold text-gray-900 mb-3">
                Course Details
              </Text>

              <View className="bg-white rounded-2xl p-4 shadow-sm gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700 font-medium">Total Tests</Text>
                  <Text className="text-gray-900 font-bold">
                    {course?.totalTests ?? 0}
                  </Text>
                </View>

                <View className="h-px bg-gray-100" />

                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700 font-medium">
                    Total Questions
                  </Text>
                  <Text className="text-gray-900 font-bold">
                    {course?.totalQuestions ?? 0}
                  </Text>
                </View>

                <View className="h-px bg-gray-100" />

                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700 font-medium">
                    Estimated Hours
                  </Text>
                  <Text className="text-gray-900 font-bold">
                    {course?.estimatedHours ?? 0}h
                  </Text>
                </View>

                <View className="h-px bg-gray-100" />

                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700 font-medium">Price</Text>
                  <Text className="text-gray-900 font-bold">
                    {formatCurrency(course?.price ?? 0)}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default CourseAnalytics;
