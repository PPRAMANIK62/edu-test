import TeacherCourseCard from "@/components/teacher/course-card";
import { useCoursesByTeacher } from "@/hooks/use-courses";
import { isTeacher } from "@/lib/permissions";
import { useAuth } from "@/providers/auth";
import { router } from "expo-router";
import { BookOpen, Plus } from "lucide-react-native";
import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TeacherCourses = () => {
  const { userProfile } = useAuth();
  const canCreate = userProfile ? isTeacher(userProfile.role) : false;
  const teacherId = userProfile?.id;

  const insets = useSafeAreaInsets();

  // Fetch teacher's courses from database
  const { data: coursesData, isLoading } = useCoursesByTeacher(teacherId);

  // Transform courses to match CourseCard expected format
  const courses = useMemo(() => {
    if (!coursesData?.documents) return [];

    return coursesData.documents.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      image_url: course.image_url,
      price: course.price,
      currency: course.currency,
      teacher_id: course.teacher_id,
      teacher_name: "You",
      total_tests: course.test_count,
      total_questions: 0,
      estimated_hours: course.estimated_hours,
      subjects: course.subjects,
      is_purchased: true,
      enrollment_count: course.enrollment_count,
      is_published: course.is_published,
    }));
  }, [coursesData]);

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-4" style={{ paddingTop: insets.top + 24 }}>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-3xl font-bold text-gray-900">My Courses</Text>
            {canCreate && (
              <TouchableOpacity
                onPress={() => {
                  router.push("/(teacher)/courses/create");
                }}
                className="bg-violet-600 rounded-full p-3 shadow-sm"
                activeOpacity={0.8}
              >
                <Plus size={20} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>
          <Text className="text-base text-gray-600">
            Manage your published courses and tests
          </Text>
        </View>

        <View className="px-6 pb-8">
          {courses?.map((course) => (
            <TeacherCourseCard
              key={course.id}
              course={course}
              canCreate={canCreate}
            />
          ))}

          {(!courses || courses.length === 0) && canCreate && (
            <View className="items-center justify-center py-12">
              <View className="bg-violet-100 rounded-full p-6 mb-4">
                <BookOpen size={40} color="#7c3aed" />
              </View>
              <Text className="text-gray-900 font-bold text-lg mb-2">
                No courses yet
              </Text>
              <Text className="text-gray-600 text-center mb-6 px-8">
                Create your first course and start sharing knowledge with
                students
              </Text>
              <TouchableOpacity
                className="bg-violet-600 rounded-xl px-6 py-3 flex-row items-center"
                activeOpacity={0.8}
                onPress={() => {
                  router.push("/(teacher)/courses/create");
                }}
              >
                <Plus size={20} color="#fff" strokeWidth={2.5} />
                <Text className="text-white font-semibold ml-2">
                  Create Course
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default TeacherCourses;
