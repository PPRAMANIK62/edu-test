import CourseCardBase from "@/components/shared/course-card-base";
import { Course } from "@/types";
import { router } from "expo-router";
import { Clock, FileText } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

const StudentCourseCard = ({ course }: { course: Course }) => {
  return (
    <CourseCardBase
      title={course.title}
      description={course.description}
      imageUrl={course.image_url}
      onPress={() => router.push(`/(student)/courses/${course.id}`)}
      stats={
        <View className="flex-row items-center gap-4 mb-4">
          <View className="flex-row items-center">
            <FileText size={16} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-1">
              {course.total_tests} tests
            </Text>
          </View>
          <View className="flex-row items-center">
            <Clock size={16} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-1">
              {course.estimated_hours}h
            </Text>
          </View>
        </View>
      }
      footer={
        course.progress !== undefined && course.progress > 0 ? (
          <View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-semibold text-gray-700">
                Progress
              </Text>
              <Text className="text-sm font-bold text-primary-600">
                {course.progress}%
              </Text>
            </View>
            <View className="bg-gray-200 rounded-full h-2 overflow-hidden">
              <View
                className="bg-primary-600 h-full rounded-full"
                style={{ width: `${course.progress}%` }}
              />
            </View>
          </View>
        ) : undefined
      }
    />
  );
};

export default StudentCourseCard;
