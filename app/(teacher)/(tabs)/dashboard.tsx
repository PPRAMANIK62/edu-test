import StatCard from "@/components/teacher/stat-card";
import { useAppwrite } from "@/hooks/use-appwrite";
import { useCoursesByTeacher } from "@/hooks/use-courses";
import { isTeacher } from "@/lib/permissions";
import {
  getCoursePerformanceData,
  getEnrichedRecentEnrollments,
  getTeacherDashboardStats,
} from "@/lib/services/analytics";
import { formatCurrency, formatTimeAgo } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  DollarSign,
  Edit3,
  Plus,
  Star,
  TrendingUp,
  Users,
} from "lucide-react-native";
import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface CoursePerformance {
  courseId: string;
  title: string;
  enrollmentCount: number;
  revenue: number;
  rating: number;
  recentEnrollments: number;
}

const TeacherDashboard = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userProfile } = useAppwrite();
  const teacherId = userProfile?.$id;

  // Check permissions
  const canCreate = userProfile ? isTeacher(userProfile.role) : false;

  // Fetch teacher's courses from database
  const { data: coursesData } = useCoursesByTeacher(teacherId);

  // Fetch teacher dashboard stats from analytics service
  const { data: dashboardStats } = useQuery({
    queryKey: ["teacher-dashboard-stats", teacherId],
    queryFn: () => getTeacherDashboardStats(teacherId!),
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch enriched recent enrollments
  const { data: recentEnrollmentsData } = useQuery({
    queryKey: ["enriched-recent-enrollments"],
    queryFn: () => getEnrichedRecentEnrollments(10),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch course performance data
  const courseIds = useMemo(
    () => coursesData?.documents.map((c) => c.$id) || [],
    [coursesData],
  );

  const { data: coursePerformanceData } = useQuery({
    queryKey: ["course-performance-data", courseIds],
    queryFn: () => getCoursePerformanceData(courseIds),
    enabled: courseIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Use real stats from analytics service
  const stats = useMemo(() => {
    if (!dashboardStats || !coursesData) return null;

    return {
      coursesCreated: dashboardStats.totalCourses,
      totalStudents: dashboardStats.totalStudents,
      totalRevenue: dashboardStats.totalRevenue,
      averageRating: 4.5, // Rating would come from reviews/ratings collection
    };
  }, [dashboardStats, coursesData]);

  // Compute course performance from real data
  const coursePerformance = useMemo(() => {
    if (!coursesData || !coursePerformanceData) return [];

    return coursesData.documents.map((course) => {
      const perfData = coursePerformanceData.get(course.$id);
      return {
        courseId: course.$id,
        title: course.title,
        enrollmentCount: perfData?.enrollmentCount || 0,
        revenue: perfData?.revenue || 0,
        rating: 4.5, // Rating would come from reviews collection
        recentEnrollments: perfData?.recentEnrollments || 0,
      };
    }) as CoursePerformance[];
  }, [coursesData, coursePerformanceData]);

  // Transform recent enrollments for display
  const recentEnrollments = useMemo(() => {
    if (!recentEnrollmentsData) return [];
    return recentEnrollmentsData;
  }, [recentEnrollmentsData]);

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-4" style={{ paddingTop: insets.top + 24 }}>
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            {userProfile && isTeacher(userProfile.role)
              ? "Teacher Dashboard"
              : "TA Dashboard"}
          </Text>
          <Text className="text-base text-gray-600">
            Manage your courses and track performance
          </Text>
        </View>

        <View className="px-6 mb-6">
          <View className="flex-row flex-wrap gap-3">
            <StatCard
              icon={<BookOpen size={20} color="#7c3aed" />}
              label="Courses"
              value={stats?.coursesCreated.toString() || "0"}
              bgColor="bg-violet-50"
              iconBgColor="bg-violet-100"
            />
            <StatCard
              icon={<Users size={20} color="#0ea5e9" />}
              label="Students"
              value={stats?.totalStudents.toLocaleString() || "0"}
              bgColor="bg-sky-50"
              iconBgColor="bg-sky-100"
            />
            {/* Revenue card - only visible to teachers */}
            {canCreate && (
              <StatCard
                icon={<DollarSign size={20} color="#10b981" />}
                label="Revenue"
                value={formatCurrency(stats?.totalRevenue || 0)}
                bgColor="bg-emerald-50"
                iconBgColor="bg-emerald-100"
              />
            )}
            {/* Average rating - only visible to teachers */}
            {canCreate && (
              <StatCard
                icon={<Star size={20} color="#f59e0b" />}
                label="Avg Rating"
                value={stats?.averageRating.toFixed(1) || "0.0"}
                bgColor="bg-amber-50"
                iconBgColor="bg-amber-100"
              />
            )}
          </View>
        </View>

        {/* Create course button - only visible to teachers */}
        {canCreate && (
          <View className="px-6 mb-6">
            <TouchableOpacity
              onPress={() => {
                router.push("/(teacher)/courses/create");
              }}
              activeOpacity={0.9}
              className="rounded-2xl overflow-hidden shadow-sm"
            >
              <LinearGradient
                colors={["#7c3aed", "#6d28d9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-5 flex-row items-center justify-between"
              >
                <View className="flex-1">
                  <Text className="text-white text-xl font-bold mb-1">
                    Create New Course
                  </Text>
                  <Text className="text-violet-100 text-sm">
                    Build and publish a new course bundle
                  </Text>
                </View>
                <View className="bg-white/20 rounded-full p-3 ml-4">
                  <Plus size={24} color="#fff" strokeWidth={2.5} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {canCreate && (
          <View className="px-6 mb-6">
            <SectionHeader title="Course Performance" />
            <View className="gap-3">
              {coursePerformance?.map((course) => (
                <TouchableOpacity
                  key={course.courseId}
                  activeOpacity={0.7}
                  className="bg-white rounded-2xl p-4 shadow-sm"
                  onPress={() => {
                    router.push(
                      `/(teacher)/courses/${course.courseId}/analytics`,
                    );
                  }}
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1 pr-3">
                      <Text
                        className="text-gray-900 font-bold text-base mb-1"
                        numberOfLines={2}
                      >
                        {course.title}
                      </Text>
                      <View className="flex-row items-center gap-1">
                        <Star size={14} color="#f59e0b" fill="#f59e0b" />
                        <Text className="text-gray-600 text-sm font-semibold">
                          {course.rating.toFixed(1)}
                        </Text>
                        <Text className="text-gray-400 text-sm ml-1">
                          • {course.enrollmentCount} students
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      className="bg-violet-50 rounded-full p-2"
                      onPress={() => {
                        router.push(
                          `/(teacher)/courses/${course.courseId}/edit`,
                        );
                      }}
                    >
                      <Edit3 size={16} color="#7c3aed" />
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                    <View className="flex-row items-center gap-4">
                      <View className="flex-row items-center gap-1">
                        <TrendingUp size={16} color="#10b981" />
                        <Text className="text-emerald-600 font-bold text-sm">
                          +{course.recentEnrollments}
                        </Text>
                        <Text className="text-gray-500 text-xs">
                          this month
                        </Text>
                      </View>
                    </View>
                    <Text className="text-gray-900 font-bold text-base">
                      {formatCurrency(course.revenue)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View className="px-6 mb-6">
          <SectionHeader title="Recent Enrollments" />
          <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {recentEnrollments?.map((enrollment, index) => (
              <EnrollmentItem
                key={enrollment.id}
                enrollment={enrollment}
                isLast={index === recentEnrollments.length - 1}
                formatTimeAgo={formatTimeAgo}
              />
            ))}
          </View>
        </View>

        <View className="px-6 mb-8">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Quick Actions
          </Text>
          <View className="gap-3">
            {canCreate && (
              <QuickActionButton
                icon={<BarChart3 size={20} color="#7c3aed" />}
                label="View Analytics"
                onPress={() => {
                  router.push("/(teacher)/analytics");
                }}
                iconBgColor="bg-violet-50"
              />
            )}
            <QuickActionButton
              icon={<Users size={20} color="#0ea5e9" />}
              label="Manage Students"
              onPress={() => router.push("/(teacher)/(tabs)/students")}
              iconBgColor="bg-sky-50"
            />
            <QuickActionButton
              icon={<BookOpen size={20} color="#10b981" />}
              label="Manage Courses"
              onPress={() => router.push("/(teacher)/(tabs)/courses")}
              iconBgColor="bg-emerald-50"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default TeacherDashboard;

interface SectionHeaderProps {
  title: string;
  onViewAll?: () => void;
}

function SectionHeader({ title, onViewAll }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-lg font-bold text-gray-900">{title}</Text>
      {onViewAll && (
        <TouchableOpacity activeOpacity={0.7} onPress={onViewAll}>
          <Text className="text-violet-600 font-semibold text-sm">
            View All
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  iconBgColor: string;
}

function QuickActionButton({
  icon,
  label,
  onPress,
  iconBgColor,
}: QuickActionButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm"
    >
      <View className="flex-row items-center">
        <View className={`${iconBgColor} rounded-full p-2.5 mr-3`}>{icon}</View>
        <Text className="text-gray-900 font-semibold text-base">{label}</Text>
      </View>
      <ChevronRight size={20} color="#9ca3af" />
    </TouchableOpacity>
  );
}

interface RecentEnrollmentDisplay {
  id: string;
  studentName: string;
  courseTitle: string;
  enrolledAt: string;
  status: "active" | "completed";
}

interface EnrollmentItemProps {
  enrollment: RecentEnrollmentDisplay;
  isLast: boolean;
  formatTimeAgo: (timestamp: string) => string;
}

function EnrollmentItem({
  enrollment,
  isLast,
  formatTimeAgo,
}: EnrollmentItemProps) {
  return (
    <View key={enrollment.id}>
      <View className="p-4 flex-row items-center">
        <View className="bg-gradient-to-br from-violet-100 to-sky-100 rounded-full w-10 h-10 items-center justify-center mr-3">
          <Text className="text-violet-700 font-bold text-base">
            {enrollment.studentName.charAt(0)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 font-semibold text-sm mb-0.5">
            {enrollment.studentName}
          </Text>
          <Text className="text-gray-500 text-xs" numberOfLines={1}>
            {enrollment.courseTitle}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-gray-400 text-xs mb-1">
            {formatTimeAgo(enrollment.enrolledAt)}
          </Text>
          <View
            className={`px-2 py-0.5 rounded-full ${
              enrollment.status === "active" ? "bg-green-100" : "bg-gray-100"
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
      </View>
      {!isLast && <View className="h-px bg-gray-100 ml-16" />}
    </View>
  );
}
