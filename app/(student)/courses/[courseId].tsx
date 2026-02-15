import ProgressBar from "@/components/student/courses/progress-bar";
import CoursesTestCard from "@/components/student/courses/test-card";
import { PaymentButton } from "@/components/student/payment-button";
import { useAuth } from "@/providers/auth";
import { useCourse } from "@/hooks/use-courses";
import { useIsStudentEnrolled } from "@/hooks/use-enrollments";
import { usePurchaseStatus } from "@/hooks/use-payments";
import { usePublishedTestsByCourse } from "@/hooks/use-tests";
import type { Course, Test } from "@/types";
import { Stack, useLocalSearchParams } from "expo-router";
import { Clock, FileText } from "lucide-react-native";
import React, { useMemo } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CourseDetail = () => {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { userProfile } = useAuth();
  const studentId = userProfile?.id;

  // Fetch course details
  const { data: courseData, isLoading: courseLoading } = useCourse(courseId);

  // Fetch tests for this course
  const { data: testsData, isLoading: testsLoading } =
    usePublishedTestsByCourse(courseId);

  // Check if student is enrolled
  const { data: isEnrolled } = useIsStudentEnrolled(studentId, courseId);

  // Payment status
  const { hasPurchased, isFree, canAccess } = usePurchaseStatus(
    studentId,
    courseId,
    courseData?.price,
  );

  // Map course data to Course type
  const course = useMemo((): Course | null => {
    if (!courseData) return null;

    return {
      id: courseData.id,
      title: courseData.title,
      description: courseData.description,
      image_url: courseData.image_url,
      price: courseData.price,
      currency: courseData.currency,
      teacher_id: courseData.teacher_id,
      teacher_name: "Instructor", // TODO: Fetch teacher name
      total_tests: testsData?.total || 0,
      total_questions: 0, // Could compute from tests if needed
      estimated_hours: courseData.estimated_hours,
      subjects: courseData.subjects,
      is_purchased: isEnrolled || hasPurchased || canAccess || false,
      enrollment_count: 0,
    };
  }, [courseData, testsData, isEnrolled, hasPurchased, canAccess]);

  // Map tests to Test type
  const tests = useMemo((): Test[] => {
    if (!testsData?.documents) return [];

    return testsData.documents.map((test) => ({
      id: test.id,
      course_id: test.course_id,
      title: test.title,
      description: test.description,
      duration_minutes: test.duration_minutes,
      total_questions: test.question_count,
      subjects: [],
      passing_score: test.passing_score,
      attempt_count: 0, // Will be computed from attempts
      is_available: test.is_published,
    }));
  }, [testsData]);

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
          source={{ uri: course.image_url }}
          className="w-full h-64"
          resizeMode="cover"
        />

        <View className="p-6">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            {course.title}
          </Text>
          <Text className="text-sm text-primary-600 font-medium mb-4">
            {course.teacher_name}
          </Text>

          <View className="flex-row items-center gap-4 mb-6">
            <View className="flex-row items-center">
              <FileText size={18} color="#6b7280" />
              <Text className="text-base text-gray-600 ml-2">
                {course.total_tests} tests
              </Text>
            </View>
            <View className="flex-row items-center">
              <Clock size={18} color="#6b7280" />
              <Text className="text-base text-gray-600 ml-2">
                {course.estimated_hours}h
              </Text>
            </View>
          </View>

          {course.progress && <ProgressBar course={course} />}

          {!course.is_purchased && (
            <View className="bg-primary-50 border-2 border-primary-600 rounded-2xl p-5 mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-2xl font-bold text-gray-900 mb-1">
                    {isFree ? "Free" : `₹${course.price}`}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {isFree ? "Free course" : "One-time purchase"}
                  </Text>
                </View>
              </View>
              <PaymentButton
                courseId={course.id}
                price={course.price}
                showPrice={false}
                buttonText={isFree ? "Enroll for Free" : "Purchase Course"}
              />
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
                    isPurchased={course.is_purchased}
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
