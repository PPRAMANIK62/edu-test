import StatCard from "@/components/teacher/stat-card";
import TimeRangeSelector from "@/components/teacher/time-range-selector";
import { useAuth } from "@/providers/auth";
import { useRevenueAnalytics } from "@/hooks/use-teacher-analytics";
import { isTeacher } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";
import { TimeRangeFilter } from "@/types";
import { router } from "expo-router";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TeacherAnalytics = () => {
  const insets = useSafeAreaInsets();
  const { userProfile } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>("30d");

  // Check if user can view revenue
  const showRevenue = userProfile ? isTeacher(userProfile.role) : false;

  // Courses are fetched as part of revenue analytics

  // Fetch analytics data
  const {
    data: revenueData,
    isLoading,
    error,
  } = useRevenueAnalytics(userProfile?.id || "", timeRange);

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pb-4 pt-6">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Analytics
          </Text>
          <Text className="text-base text-gray-600">
            Track your performance and revenue
          </Text>
        </View>

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
        {!isLoading && !error && revenueData && (
          <>
            {/* Key Stats */}
            <View className="px-6 mb-6">
              <View className="flex-row flex-wrap gap-3">
                {/* Revenue stats - only visible to teachers */}
                {showRevenue && (
                  <>
                    <StatCard
                      icon={<DollarSign size={20} color="#10b981" />}
                      label="Total Revenue"
                      value={formatCurrency(revenueData.total_revenue)}
                      bgColor="bg-emerald-50"
                      iconBgColor="bg-emerald-100"
                    />
                    <StatCard
                      icon={<TrendingUp size={20} color="#0ea5e9" />}
                      label="Avg/Course"
                      value={formatCurrency(
                        revenueData.top_courses.length > 0
                          ? revenueData.total_revenue /
                              revenueData.top_courses.length
                          : 0,
                      )}
                      bgColor="bg-sky-50"
                      iconBgColor="bg-sky-100"
                    />
                    <StatCard
                      icon={
                        revenueData.trends.percentage_change >= 0 ? (
                          <ArrowUp size={20} color="#10b981" />
                        ) : (
                          <ArrowDown size={20} color="#ef4444" />
                        )
                      }
                      label="Growth"
                      value={`${revenueData.trends.percentage_change >= 0 ? "+" : ""}${revenueData.trends.percentage_change.toFixed(1)}%`}
                      bgColor={
                        revenueData.trends.percentage_change >= 0
                          ? "bg-emerald-50"
                          : "bg-red-50"
                      }
                      iconBgColor={
                        revenueData.trends.percentage_change >= 0
                          ? "bg-emerald-100"
                          : "bg-red-100"
                      }
                    />
                  </>
                )}

                {/* Non-revenue stats - visible to all */}
                <StatCard
                  icon={<BookOpen size={20} color="#7c3aed" />}
                  label="Active Courses"
                  value={revenueData.top_courses.length.toString()}
                  bgColor="bg-violet-50"
                  iconBgColor="bg-violet-100"
                />
              </View>
            </View>

            {/* Monthly Revenue Chart - only visible to teachers */}
            {showRevenue && revenueData.revenue_by_month.length > 0 && (
              <View className="px-6 mb-6">
                <Text className="text-lg font-bold text-gray-900 mb-3">
                  Revenue by Month
                </Text>

                <View className="bg-white rounded-2xl px-4 py-2 shadow-sm">
                  {revenueData.revenue_by_month.map((month, index) => {
                    const maxRevenue = Math.max(
                      ...revenueData.revenue_by_month.map((m) => m.revenue),
                    );
                    const barWidth =
                      maxRevenue > 0
                        ? Math.max((month.revenue / maxRevenue) * 100, 5)
                        : 5;

                    return (
                      <View key={month.month}>
                        <View className="py-3">
                          <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-gray-700 font-medium text-sm">
                              {month.month}
                            </Text>
                            <Text className="text-gray-900 font-bold text-sm">
                              {formatCurrency(month.revenue)}
                            </Text>
                          </View>
                          <View className="bg-gray-100 rounded-full h-2 overflow-hidden">
                            <View
                              className="bg-violet-600 h-full rounded-full"
                              style={{ width: `${barWidth}%` }}
                            />
                          </View>
                        </View>
                        {index < revenueData.revenue_by_month.length - 1 && (
                          <View className="h-px bg-gray-100" />
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Top Performing Courses */}
            {revenueData.top_courses.length > 0 && (
              <View className="px-6 pb-8">
                <Text className="text-lg font-bold text-gray-900 mb-3">
                  Top Performing Courses
                </Text>

                <View className="gap-3">
                  {revenueData.top_courses.map((course, index) => {
                    return (
                      <TouchableOpacity
                        key={course.course_id}
                        className="bg-white rounded-2xl p-4 shadow-sm"
                        activeOpacity={0.7}
                        onPress={() => {
                          router.push(
                            `/(teacher)/courses/${course.course_id}/analytics`,
                          );
                        }}
                      >
                        <View className="flex-row items-start mb-3">
                          <View className="bg-violet-50 rounded-full w-10 h-10 items-center justify-center mr-3">
                            <Text className="text-violet-700 font-bold text-base">
                              #{index + 1}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text
                              className="text-gray-900 font-bold text-base mb-1"
                              numberOfLines={2}
                            >
                              {course.course_title}
                            </Text>
                            <View className="flex-row items-center gap-3">
                              <View className="flex-row items-center gap-1">
                                <Users size={14} color="#6b7280" />
                                <Text className="text-gray-600 text-xs">
                                  {course.enrollment_count} students
                                </Text>
                              </View>
                              <View className="flex-row items-center gap-1">
                                <BookOpen size={14} color="#6b7280" />
                                <Text className="text-gray-600 text-xs">
                                  {course.test_count} tests
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>

                        {/* Revenue info - only visible to teachers */}
                        {showRevenue && (
                          <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                            <Text className="text-gray-600 text-sm font-medium">
                              Revenue
                            </Text>
                            <Text className="text-gray-900 font-bold text-lg">
                              {formatCurrency(course.revenue)}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default TeacherAnalytics;
