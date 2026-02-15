import StatCard from "@/components/teacher/stat-card";
import StudentCard from "@/components/teacher/student-card";
import { useAuth } from "@/providers/auth";
import { useCoursesByTeacher } from "@/hooks/use-courses";
import { useRecentEnrollments } from "@/hooks/use-enrollments";
import { isTeacher } from "@/lib/permissions";
import {
  getAverageCompletionRate,
  getStudentsWithStats,
} from "@/lib/services/analytics";
import { getUsersByRole } from "@/lib/user-management";
import { useQuery } from "@tanstack/react-query";
import { Award, Filter, Search, TrendingUp, Users } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TeacherStudents = () => {
  const insets = useSafeAreaInsets();
  const { userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const teacherId = userProfile?.id;

  // Check if user can view revenue/spending data
  const showRevenue = userProfile ? isTeacher(userProfile.role) : false;

  // Fetch teacher's courses to get course IDs
  const { data: coursesData } = useCoursesByTeacher(teacherId);
  const courseIds = useMemo(
    () => coursesData?.documents.map((c) => c.id) || [],
    [coursesData],
  );

  // Fetch students from database
  const { data: studentsData } = useQuery({
    queryKey: ["students", "student"],
    queryFn: () => getUsersByRole("student"),
  });

  // Fetch recent enrollments for activity stats
  const { data: recentEnrollments } = useRecentEnrollments(100);

  // Fetch student stats from analytics service
  const studentIds = useMemo(
    () => studentsData?.map((s) => s.id) || [],
    [studentsData],
  );

  const { data: studentStatsMap } = useQuery({
    queryKey: ["students-stats", studentIds],
    queryFn: () => getStudentsWithStats(studentIds),
    enabled: studentIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch average completion rate
  const { data: avgCompletionRate } = useQuery({
    queryKey: ["avg-completion-rate", courseIds],
    queryFn: () => getAverageCompletionRate(courseIds),
    enabled: courseIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Transform student data for display with real stats
  const students = useMemo(() => {
    if (!studentsData) return [];

    return studentsData.map((user) => {
      const stats = studentStatsMap?.get(user.id);
      return {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        enrolled_courses: stats?.enrolledCourses || 0,
        completed_tests: stats?.completedTests || 0,
        average_score: stats?.averageScore || 0,
        total_spent: stats?.totalSpent || 0,
        last_active: new Date().toISOString(), // Would need activity tracking
        status: "active" as const,
      };
    });
  }, [studentsData, studentStatsMap]);

  // Compute stats from real data
  const stats = useMemo(() => {
    const totalActive = students?.length || 0;
    const newThisMonth = recentEnrollments?.length || 0;

    // Find top performer by average score
    const topPerformer =
      students?.reduce(
        (best, student) =>
          student.average_score > (best?.average_score || 0) ? student : best,
        students[0],
      )?.name || "N/A";

    return {
      totalActive,
      newThisMonth,
      avgCompletion: avgCompletionRate || 0,
      topPerformer,
    };
  }, [students, recentEnrollments, avgCompletionRate]);

  const filteredStudents = students?.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-4" style={{ paddingTop: insets.top + 24 }}>
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Students & Ratings
          </Text>
          <Text className="text-base text-gray-600">
            Track student progress and engagement
          </Text>
        </View>

        <View className="px-6 mb-6">
          <View className="flex-row flex-wrap gap-3 mb-4">
            <StatCard
              icon={<Users size={20} color="#7c3aed" />}
              value={stats?.totalActive.toLocaleString() ?? "0"}
              label="Total Active"
              iconBgColor="bg-violet-50"
            />
            {/* This Month card - only visible to teachers */}
            {showRevenue && (
              <StatCard
                icon={<TrendingUp size={20} color="#10b981" />}
                value={`+${stats?.newThisMonth ?? 0}`}
                label="This Month"
                iconBgColor="bg-emerald-50"
              />
            )}
            <StatCard
              icon={<Award size={20} color="#0ea5e9" />}
              value={`${stats?.avgCompletion ?? 0}%`}
              label="Avg Completion"
              iconBgColor="bg-sky-50"
            />
          </View>

          <View className="bg-white rounded-xl px-4 py-2 flex-row items-center shadow-sm">
            <Search size={20} color="#9ca3af" />
            <TextInput
              className="flex-1 ml-3 text-gray-900 text-base"
              placeholder="Search students..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity activeOpacity={0.7} className="ml-2">
              <Filter size={20} color="#7c3aed" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-6 pb-8">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            All Students
          </Text>
          <View className="gap-3">
            {filteredStudents?.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                showRevenue={showRevenue}
              />
            ))}
          </View>

          {filteredStudents?.length === 0 && (
            <View className="items-center justify-center py-12">
              <View className="bg-gray-100 rounded-full p-6 mb-4">
                <Users size={40} color="#9ca3af" />
              </View>
              <Text className="text-gray-900 font-bold text-lg mb-2">
                No students found
              </Text>
              <Text className="text-gray-600 text-center px-8">
                Try adjusting your search query
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default TeacherStudents;
