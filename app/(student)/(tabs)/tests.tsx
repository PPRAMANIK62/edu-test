import TestCard from "@/components/student/test-card";
import { useAppwrite } from "@/hooks/use-appwrite";
import { useEnrolledCourses } from "@/hooks/use-courses";
import { getPublishedTestsByCourse } from "@/lib/services/tests";
import type { Test } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FileText } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TestsTab = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userProfile } = useAppwrite();
  const studentId = userProfile?.$id;

  // Fetch enrolled courses
  const { data: enrolledCoursesData, isLoading: coursesLoading } =
    useEnrolledCourses(studentId);

  // Fetch tests for all enrolled courses
  const { data: availableTests, isLoading: testsLoading } = useQuery({
    queryKey: [
      "available-tests",
      enrolledCoursesData?.documents?.map((c) => c.$id),
    ],
    queryFn: async () => {
      if (
        !enrolledCoursesData?.documents ||
        enrolledCoursesData.documents.length === 0
      ) {
        return [];
      }

      // Fetch tests for each enrolled course
      const testsPromises = enrolledCoursesData.documents.map(
        async (course) => {
          const testsResult = await getPublishedTestsByCourse(course.$id);
          return testsResult.documents.map(
            (test): Test & { courseName: string } => ({
              id: test.$id,
              courseId: test.courseId,
              title: test.title,
              description: test.description,
              durationMinutes: test.durationMinutes,
              totalQuestions: 0, // Will be fetched in test intro
              subjects: [],
              passingScore: test.passingScore,
              attemptCount: 0, // TODO: Fetch from attempts
              isAvailable: test.isPublished,
              courseName: course.title,
            })
          );
        }
      );

      const testsArrays = await Promise.all(testsPromises);
      return testsArrays.flat();
    },
    enabled:
      !!enrolledCoursesData?.documents &&
      enrolledCoursesData.documents.length > 0,
  });

  const isLoading = coursesLoading || testsLoading;

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-4" style={{ paddingTop: insets.top + 24 }}>
          <Text className="text-3xl font-bold text-gray-900 mb-2">Tests</Text>
          <Text className="text-base text-gray-600">
            Practice and improve your skills
          </Text>
        </View>

        <View className="px-6 pb-6">
          {isLoading ? (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color="#1890ff" />
            </View>
          ) : availableTests && availableTests.length > 0 ? (
            availableTests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                courseName={test.courseName}
              />
            ))
          ) : (
            <View className="items-center justify-center py-20">
              <FileText size={64} color="#d1d5db" />
              <Text className="text-gray-500 text-lg font-semibold mt-4 mb-2">
                No tests available
              </Text>
              <Text className="text-gray-400 text-center mb-6">
                Purchase a course to access tests
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

export default TestsTab;
