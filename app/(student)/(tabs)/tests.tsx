import ErrorState from "@/components/error-state";
import TestCard from "@/components/student/test-card";
import { useAppwrite } from "@/hooks/use-appwrite";
import { useAvailableTests } from "@/hooks/use-available-tests";
import { useEnrolledCourses } from "@/hooks/use-courses";
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

  const {
    data: enrolledCoursesData,
    isLoading: coursesLoading,
    isError: isCoursesError,
    refetch: refetchCourses,
  } = useEnrolledCourses(studentId);

  const {
    data: availableTests,
    isLoading: testsLoading,
    isError: isTestsError,
    refetch: refetchTests,
  } = useAvailableTests(studentId, enrolledCoursesData?.documents);

  const isLoading = coursesLoading || testsLoading;
  const isError = isCoursesError || isTestsError;

  const refetchAll = () => {
    refetchCourses();
    refetchTests();
  };

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
          ) : isError ? (
            <ErrorState onRetry={refetchAll} />
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
