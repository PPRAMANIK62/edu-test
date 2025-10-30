import StudentCourseCard from "@/components/student/course-card";
import { MOCK_COURSES } from "@/lib/mockdata";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { BookOpen } from "lucide-react-native";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CoursesTab = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: courses } = useQuery({
    queryKey: ["my-courses"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_COURSES.filter((c) => c.isPurchased);
    },
  });

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-4" style={{ paddingTop: insets.top + 24 }}>
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            My Courses
          </Text>
          <Text className="text-base text-gray-600">
            Your enrolled courses and progress
          </Text>
        </View>

        <View className="px-6 pb-6">
          {courses?.map((course) => (
            <StudentCourseCard key={course.id} course={course} />
          ))}

          {courses?.length === 0 && (
            <View className="items-center justify-center py-20">
              <BookOpen size={64} color="#d1d5db" />
              <Text className="text-gray-500 text-lg font-semibold mt-4 mb-2">
                No courses yet
              </Text>
              <Text className="text-gray-400 text-center mb-6">
                Browse and purchase courses to get started
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(student)/(tabs)/browse")}
                className="bg-primary-600 rounded-xl px-6 py-3"
              >
                <Text className="text-white font-semibold">Browse Courses</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default CoursesTab;
