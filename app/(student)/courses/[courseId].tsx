import ProgressBar from "@/components/student/courses/progress-bar";
import CoursesTestCard from "@/components/student/courses/test-card";
import { useAppwrite } from "@/hooks/use-appwrite";
import { useCourse } from "@/hooks/use-courses";
import {
  useEnrollStudent,
  useIsStudentEnrolled,
} from "@/hooks/use-enrollments";
import { usePublishedTestsByCourse } from "@/hooks/use-tests";
import type { Course, Test } from "@/types";
import { Stack, useLocalSearchParams } from "expo-router";
import { Clock, FileText } from "lucide-react-native";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CourseDetail = () => {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { userProfile } = useAppwrite();
  const studentId = userProfile?.$id;

  // Fetch course details
  const { data: courseData, isLoading: courseLoading } = useCourse(courseId);

  // Fetch tests for this course
  const { data: testsData, isLoading: testsLoading } =
    usePublishedTestsByCourse(courseId);

  // Check if student is enrolled
  const { data: isEnrolled } = useIsStudentEnrolled(studentId, courseId);

  // Enrollment mutation
  const enrollMutation = useEnrollStudent();

  // Map course data to Course type
  const course = useMemo((): Course | null => {
    if (!courseData) return null;

    return {
      id: courseData.$id,
      title: courseData.title,
      description: courseData.description,
      imageUrl: courseData.imageUrl,
      price: courseData.price,
      currency: courseData.currency,
      teacherId: courseData.teacherId,
      teacherName: "Instructor", // TODO: Fetch teacher name
      totalTests: testsData?.total || 0,
      totalQuestions: 0, // Could compute from tests if needed
      estimatedHours: courseData.estimatedHours,
      subjects: courseData.subjects,
      isPurchased: isEnrolled || false,
      enrollmentCount: 0,
    };
  }, [courseData, testsData, isEnrolled]);

  // Map tests to Test type
  const tests = useMemo((): Test[] => {
    if (!testsData?.documents) return [];

    return testsData.documents.map((test) => ({
      id: test.$id,
      courseId: test.courseId,
      title: test.title,
      description: test.description,
      durationMinutes: test.durationMinutes,
      totalQuestions: 0, // Will be fetched in test intro
      subjects: [], // Will be fetched in test intro
      passingScore: test.passingScore,
      attemptCount: 0, // Will be computed from attempts
      isAvailable: test.isPublished,
    }));
  }, [testsData]);

  const handlePurchase = () => {
    if (!studentId || !courseId) return;

    enrollMutation.mutate(
      { studentId, courseId },
      {
        onSuccess: () => {
          Alert.alert("Success", "Course purchased and enrolled successfully!");
        },
        onError: () => {
          Alert.alert("Error", "Failed to purchase course. Please try again.");
        },
      }
    );
  };

  if (courseLoading || !course) {
    return (
      <SafeAreaView
        className="flex-1 bg-white items-center justify-center"
        edges={["top"]}
      >
        <ActivityIndicator size="large" color="#1890ff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <Stack.Screen />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: course.imageUrl }}
          className="w-full h-64"
          resizeMode="cover"
        />

        <View className="p-6">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            {course.title}
          </Text>
          <Text className="text-sm text-primary-600 font-medium mb-4">
            {course.teacherName}
          </Text>

          <View className="flex-row items-center gap-4 mb-6">
            <View className="flex-row items-center">
              <FileText size={18} color="#6b7280" />
              <Text className="text-base text-gray-600 ml-2">
                {course.totalTests} tests
              </Text>
            </View>
            <View className="flex-row items-center">
              <Clock size={18} color="#6b7280" />
              <Text className="text-base text-gray-600 ml-2">
                {course.estimatedHours}h
              </Text>
            </View>
          </View>

          {course.progress && <ProgressBar course={course} />}

          {!course.isPurchased && (
            <View className="bg-primary-50 border-2 border-primary-600 rounded-2xl p-5 mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-2xl font-bold text-gray-900 mb-1">
                    ₹{course.price}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    One-time purchase
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handlePurchase}
                disabled={enrollMutation.isPending}
                className="bg-primary-600 rounded-xl py-3.5 items-center"
                activeOpacity={0.8}
              >
                {enrollMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    Purchase Course
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              About This Course
            </Text>
            <Text className="text-base text-gray-600 leading-6">
              {course.description}
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Tests ({tests.length})
            </Text>
            <View className="gap-3">
              {testsLoading ? (
                <ActivityIndicator size="small" color="#1890ff" />
              ) : tests.length > 0 ? (
                tests.map((test) => (
                  <CoursesTestCard
                    key={test.id}
                    test={test}
                    isPurchased={course.isPurchased}
                  />
                ))
              ) : (
                <Text className="text-gray-500 text-center py-4">
                  No tests available yet
                </Text>
              )}
            </View>
          </View>

          <View className="mb-8">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Subjects Covered
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {course.subjects.map((subject) => (
                <View
                  key={subject}
                  className="bg-primary-50 rounded-lg px-4 py-2"
                >
                  <Text className="text-primary-700 font-medium text-sm">
                    {subject}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CourseDetail;
