import TeacherCourseCard from "@/components/teacher/course-card";
import { MOCK_COURSES } from "@/lib/mockdata";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Plus } from "lucide-react-native";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TeacherCourses = () => {
  const insets = useSafeAreaInsets();

  const { data: courses } = useQuery({
    queryKey: ["teacher-courses"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_COURSES.filter((c) => c.teacherId === "teacher-1");
    },
  });

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-4" style={{ paddingTop: insets.top + 24 }}>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-3xl font-bold text-gray-900">My Courses</Text>
            <TouchableOpacity
              onPress={() => {
                console.log("Create new course");
              }}
              className="bg-violet-600 rounded-full p-3 shadow-sm"
              activeOpacity={0.8}
            >
              <Plus size={20} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <Text className="text-base text-gray-600">
            Manage your published courses and tests
          </Text>
        </View>

        <View className="px-6 pb-8">
          {courses?.map((course) => (
            <TeacherCourseCard key={course.id} course={course} />
          ))}

          {(!courses || courses.length === 0) && (
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
                  console.log("Create first course");
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
