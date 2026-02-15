import StudentCourseCard from "@/components/student/course-card";
import { useAppwrite } from "@/hooks/use-appwrite";
import { useEnrolledCourses } from "@/hooks/use-courses";
import { useEnrollmentsByStudent } from "@/hooks/use-enrollments";
import { getUserNamesByIds } from "@/lib/user-management";
import type { Course } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { BookOpen } from "lucide-react-native";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CoursesTab = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userProfile } = useAppwrite();
  const studentId = userProfile?.$id;

  // Fetch enrolled courses for the student
  const { data: enrolledCoursesData, isLoading } =
    useEnrolledCourses(studentId);

  // Fetch enrollments to get progress info
  const { data: enrollmentsData } = useEnrollmentsByStudent(studentId);

  // Get unique teacher IDs
  const teacherIds = useMemo(
    () => [
      ...new Set(enrolledCoursesData?.documents.map((c) => c.teacherId) || []),
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

  // Map courses with progress from enrollments
  const courses = useMemo(() => {
    if (!enrolledCoursesData?.documents) return [];

    return enrolledCoursesData.documents.map((course): Course => {
      // Find enrollment progress for this course
      const enrollment = enrollmentsData?.documents.find(
        (e) => e.courseId === course.$id,
      );

      return {
        id: course.$id,
        title: course.title,
        description: course.description,
        imageUrl: course.imageUrl,
        price: course.price,
        currency: course.currency,
        teacherId: course.teacherId,
        teacherName:
          teacherNamesMap?.get(course.teacherId) || "Course Instructor",
        totalTests: course.testCount,
        totalQuestions: 0,
        estimatedHours: course.estimatedHours,
        subjects: course.subjects,
        isPurchased: true, // They are enrolled so they have access
        progress: enrollment?.progress || 0,
        enrollmentCount: course.enrollmentCount,
      };
    });
  }, [enrolledCoursesData, enrollmentsData, teacherNamesMap]);

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
          {isLoading ? (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color="#1890ff" />
            </View>
          ) : courses.length > 0 ? (
            courses.map((course) => (
              <StudentCourseCard key={course.id} course={course} />
            ))
          ) : (
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
