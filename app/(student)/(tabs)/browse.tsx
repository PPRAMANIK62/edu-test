import BrowseCard from "@/components/student/browse-card";
import { useAppwrite } from "@/hooks/use-appwrite";
import { useCourses } from "@/hooks/use-courses";
import { useEnrollmentsByStudent } from "@/hooks/use-enrollments";
import type { Course } from "@/types";
import React, { useMemo } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BrowseTab = () => {
  const insets = useSafeAreaInsets();
  const { userProfile } = useAppwrite();
  const studentId = userProfile?.$id;

  // Fetch all published courses
  const { data: coursesData, isLoading: coursesLoading } = useCourses();

  // Fetch student's enrollments to filter out enrolled courses
  const { data: enrollmentsData } = useEnrollmentsByStudent(studentId);

  // Filter courses - show courses the student is NOT enrolled in
  // and map to Course type expected by BrowseCard
  const courses = useMemo(() => {
    if (!coursesData?.documents) return [];

    const enrolledCourseIds = new Set(
      enrollmentsData?.documents.map((e) => e.courseId) || []
    );

    return coursesData.documents
      .filter((course) => !enrolledCourseIds.has(course.$id))
      .map(
        (course): Course => ({
          id: course.$id,
          title: course.title,
          description: course.description,
          imageUrl: course.imageUrl,
          price: course.price,
          currency: course.currency,
          teacherId: course.teacherId,
          teacherName: "Instructor", // TODO: Fetch teacher name
          totalTests: 0, // Will be computed on course detail page
          totalQuestions: 0,
          estimatedHours: course.estimatedHours,
          subjects: course.subjects,
          isPurchased: false,
          enrollmentCount: 0,
        })
      );
  }, [coursesData, enrollmentsData]);

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-4" style={{ paddingTop: insets.top + 24 }}>
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Browse Courses
          </Text>
          <Text className="text-base text-gray-600">
            Discover courses to advance your learning
          </Text>
        </View>

        <View className="px-6 pb-6">
          {coursesLoading ? (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color="#1890ff" />
            </View>
          ) : courses.length > 0 ? (
            courses.map((course) => (
              <BrowseCard key={course.id} course={course} />
            ))
          ) : (
            <View className="items-center justify-center py-20">
              <Text className="text-gray-500 text-lg font-semibold">
                No courses available
              </Text>
              <Text className="text-gray-400 text-center mt-2">
                Check back later for new courses
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default BrowseTab;
