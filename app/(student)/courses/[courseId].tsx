import ProgressBar from "@/components/student/courses/progress-bar";
import CoursesTestCard from "@/components/student/courses/test-card";
import { MOCK_COURSES, MOCK_TESTS } from "@/lib/mockdata";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Clock, FileText } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const CourseDetail = () => {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_COURSES.find((c) => c.id === courseId);
    },
  });

  const { data: tests } = useQuery({
    queryKey: ["course-tests", courseId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_TESTS.filter((t) => t.courseId === courseId);
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      // TODO: Implement purchase logic
      // await purchaseCourse(courseId);
      return courseId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["browse-courses"] });
      queryClient.invalidateQueries({ queryKey: ["my-courses"] });
      Alert.alert("Success", "Course purchased successfully!");
    },
    onError: () => {
      Alert.alert("Error", "Failed to purchase course. Please try again.");
    },
  });

  if (!course) return null;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: course.title,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#1f2937" />
            </TouchableOpacity>
          ),
        }}
      />
      <View className="flex-1 bg-white">
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
                      ${course.price}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      One-time purchase
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => purchaseMutation.mutate(course.id)}
                  disabled={purchaseMutation.isPending}
                  className="bg-primary-600 rounded-xl py-3.5 items-center"
                  activeOpacity={0.8}
                >
                  {purchaseMutation.isPending ? (
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
                Tests ({tests?.length || 0})
              </Text>
              <View className="gap-3">
                {tests?.map((test) => (
                  <CoursesTestCard
                    key={test.id}
                    test={test}
                    isPurchased={course.isPurchased}
                  />
                ))}
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
      </View>
    </>
  );
};

export default CourseDetail;
