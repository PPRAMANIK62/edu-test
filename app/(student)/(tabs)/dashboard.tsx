import ErrorState from "@/components/error-state";
import QuickActionButton from "@/components/student/quick-action-button";
import RecentActivityCard from "@/components/student/recent-activity-card";
import TestProgressCard from "@/components/student/test-progress-card";
import StatCard from "@/components/teacher/stat-card";
import { useRecentActivities } from "@/hooks/use-activities";
import { useAuth } from "@/providers/auth";
import { useAttemptsByStudent } from "@/hooks/use-attempts";
import { useEnrolledCourses } from "@/hooks/use-courses";
import { useActiveEnrollmentsByStudent } from "@/hooks/use-enrollments";
import { getUserNamesByIds } from "@/lib/user-management";
import { useQuery } from "@tanstack/react-query";
import { Award, BookOpen, Clock, TrendingUp } from "lucide-react-native";
import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const StudentDashboard = () => {
  const insets = useSafeAreaInsets();
  const { userProfile } = useAuth();
  const studentId = userProfile?.id;

  // Fetch enrolled courses for the student
  const {
    data: enrolledCoursesData,
    isError: isCoursesError,
    refetch: refetchCourses,
  } = useEnrolledCourses(studentId);

  // Fetch active enrollments with progress
  const {
    data: enrollmentsData,
    isError: isEnrollmentsError,
    refetch: refetchEnrollments,
  } = useActiveEnrollmentsByStudent(studentId);

  // Fetch recent activities for the student
  const {
    data: recentActivities,
    isError: isActivitiesError,
    refetch: refetchActivities,
  } = useRecentActivities(studentId, 5);

  // Fetch completed attempts to compute stats
  const {
    data: attemptsData,
    isError: isAttemptsError,
    refetch: refetchAttempts,
  } = useAttemptsByStudent(studentId);

  const isError =
    isCoursesError ||
    isEnrollmentsError ||
    isActivitiesError ||
    isAttemptsError;

  const refetchAll = () => {
    refetchCourses();
    refetchEnrollments();
    refetchActivities();
    refetchAttempts();
  };

  // Get unique teacher IDs
  const teacherIds = useMemo(
    () => [
      ...new Set(enrolledCoursesData?.documents.map((c) => c.teacher_id) || []),
    ],
    [enrolledCoursesData],
  );

  // Fetch teacher names
  const { data: teacherNamesMap } = useQuery({
    queryKey: ["teacher-names", teacherIds],
    queryFn: () => getUserNamesByIds(teacherIds),
    enabled: teacherIds.length > 0,
    staleTime: 10 * 60 * 1000,
  });

  // Compute student stats from real data
  const stats = useMemo(() => {
    const coursesEnrolled = enrolledCoursesData?.total || 0;

    const completedAttempts =
      attemptsData?.documents.filter((a) => a.status === "completed") || [];
    const testsCompleted = completedAttempts.length;

    const averageScore =
      testsCompleted > 0
        ? Math.round(
            completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) /
              testsCompleted,
          )
        : 0;

    // Estimate study hours (avg 30 min per test attempt)
    const totalStudyHours = Math.round((attemptsData?.total || 0) * 0.5);

    return {
      coursesEnrolled,
      testsCompleted,
      averageScore,
      totalStudyHours,
    };
  }, [enrolledCoursesData, attemptsData]);

  // Find a course to continue learning (enrolled with progress > 0)
  const continueCourse = useMemo(() => {
    if (!enrollmentsData?.documents || !enrolledCoursesData?.documents)
      return null;

    // Find enrollment with progress > 0
    const inProgressEnrollment = enrollmentsData.documents.find(
      (e) => e.progress > 0 && e.status === "active",
    );

    if (!inProgressEnrollment) return null;

    // Find the corresponding course
    const course = enrolledCoursesData.documents.find(
      (c) => c.id === inProgressEnrollment.course_id,
    );

    if (!course) return null;

    // Return course with progress info for TestProgressCard
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      image_url: course.image_url,
      price: course.price,
      currency: course.currency,
      teacher_id: course.teacher_id,
      teacher_name:
        teacherNamesMap?.get(course.teacher_id) || "Course Instructor",
      total_tests: 0, // Computed when navigating to course detail
      total_questions: 0,
      estimated_hours: course.estimated_hours,
      subjects: course.subjects,
      is_purchased: true,
      progress: inProgressEnrollment.progress,
      enrollment_count: 0,
    };
  }, [enrollmentsData, enrolledCoursesData, teacherNamesMap]);

  if (isError) {
    return (
      <View className="flex-1 bg-gray-50">
        <ErrorState onRetry={refetchAll} />
      </View>
    );
  }

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
              iconBgColor="bg-blue-50"
            />
            <StatCard
              icon={<Award size={20} color="#38a169" />}
              label="Tests Done"
              value={stats?.testsCompleted.toString() || "0"}
              iconBgColor="bg-green-50"
            />
            <StatCard
              icon={<TrendingUp size={20} color="#f59e0b" />}
              label="Avg Score"
              value={`${stats?.averageScore || 0}%`}
              iconBgColor="bg-amber-50"
            />
            <StatCard
              icon={<Clock size={20} color="#8b5cf6" />}
              label="Study Hours"
              value={stats?.totalStudyHours.toString() || "0"}
              iconBgColor="bg-purple-50"
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
                activity={{
                  id: activity.id,
                  type: activity.type,
                  title: activity.title,
                  subtitle: activity.subtitle,
                  timestamp: activity.created_at,
                }}
                index={index}
                length={recentActivities.length}
              />
            ))}
            {(!recentActivities || recentActivities.length === 0) && (
              <View className="p-4">
                <Text className="text-gray-500 text-center">
                  No recent activity
                </Text>
              </View>
            )}
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
};

export default StudentDashboard;
