import QuickActionButton from "@/components/student/quick-action-button";
import RecentActivityCard from "@/components/student/recent-activity-card";
import TestProgressCard from "@/components/student/test-progress-card";
import StatCard from "@/components/teacher/stat-card";
import {
  MOCK_COURSES,
  MOCK_RECENT_ACTIVITIES,
  MOCK_STUDENT_STATS,
} from "@/lib/mockdata";
import { useQuery } from "@tanstack/react-query";
import { Award, BookOpen, Clock, TrendingUp } from "lucide-react-native";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StudentDashboard() {
  const insets = useSafeAreaInsets();

  const { data: stats } = useQuery({
    queryKey: ["student-stats"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_STUDENT_STATS;
    },
  });

  const { data: recentActivities } = useQuery({
    queryKey: ["recent-activities"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_RECENT_ACTIVITIES;
    },
  });

  const { data: continueCourse } = useQuery({
    queryKey: ["continue-course"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_COURSES.find(
        (c) => c.isPurchased && c.progress && c.progress > 0
      );
    },
  });

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-4" style={{ paddingTop: insets.top + 24 }}>
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </Text>
          <Text className="text-base text-gray-600">
            Track your progress and continue learning
          </Text>
        </View>

        <View className="px-6 mb-6">
          <View className="flex-row flex-wrap gap-3">
            <StatCard
              icon={<BookOpen size={20} color="#1890ff" />}
              label="Courses"
              value={stats?.coursesEnrolled.toString() || "0"}
              bgColor="bg-blue-50"
            />
            <StatCard
              icon={<Award size={20} color="#38a169" />}
              label="Tests Done"
              value={stats?.testsCompleted.toString() || "0"}
              bgColor="bg-green-50"
            />
            <StatCard
              icon={<TrendingUp size={20} color="#f59e0b" />}
              label="Avg Score"
              value={`${stats?.averageScore || 0}%`}
              bgColor="bg-amber-50"
            />
            <StatCard
              icon={<Clock size={20} color="#8b5cf6" />}
              label="Study Hours"
              value={stats?.totalStudyHours.toString() || "0"}
              bgColor="bg-purple-50"
            />
          </View>
        </View>

        {continueCourse && <TestProgressCard course={continueCourse} />}

        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-900">
              Recent Activity
            </Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text className="text-primary-600 font-semibold text-sm">
                View All
              </Text>
            </TouchableOpacity>
          </View>
          <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {recentActivities?.map((activity, index) => (
              <RecentActivityCard
                key={activity.id}
                activity={activity}
                index={index}
                length={recentActivities.length}
              />
            ))}
          </View>
        </View>

        <View className="px-6 mb-8">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Quick Actions
          </Text>
          <View className="gap-3">
            <QuickActionButton
              bgColor="primary"
              iconColor="#1890ff"
              label="Browse Courses"
            />
            <QuickActionButton
              bgColor="green"
              iconColor="#38a169"
              label="Take a Test"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
