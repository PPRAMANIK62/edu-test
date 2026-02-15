import CourseCardBase from "@/components/shared/course-card-base";
import { Course } from "@/types";
import { router } from "expo-router";
import { BookOpen, Edit3, Trash2, Users } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const TeacherCourseCard = ({
  course,
  canCreate,
}: {
  course: Course;
  canCreate: boolean;
}) => {
  return (
    <CourseCardBase
      title={course.title}
      description={course.description}
      imageUrl={course.image_url}
      imageHeight="h-40"
      titleClassName="text-gray-900 font-bold text-lg mb-1"
      titleLines={2}
      descriptionClassName="text-gray-600 text-sm mb-2"
      onPress={() => {
        console.log("View course details:", course.id);
      }}
      stats={
        <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-gray-100">
          <View className="flex-row items-center gap-1">
            <Users size={16} color="#6b7280" />
            <Text className="text-gray-700 font-semibold text-sm">
              {course.enrollment_count}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <BookOpen size={16} color="#6b7280" />
            <Text className="text-gray-700 font-semibold text-sm">
              {course.total_tests} tests
            </Text>
          </View>
          <View className="flex-1" />
          <Text className="text-violet-600 font-bold text-base">
            ₹{course.price}
          </Text>
        </View>
      }
      footer={
        <View className="flex-row gap-2 mt-3">
          <TouchableOpacity
            className="flex-1 bg-violet-600 rounded-xl py-3 flex-row items-center justify-center"
            activeOpacity={0.8}
            onPress={() => {
              router.push(`/(teacher)/courses/${course.id}/edit`);
            }}
          >
            <Edit3 size={16} color="#fff" />
            <Text className="text-white font-semibold ml-2">Edit</Text>
          </TouchableOpacity>
          {canCreate && (
            <TouchableOpacity
              className="bg-red-50 rounded-xl px-4 py-3"
              activeOpacity={0.8}
              onPress={() => {
                console.log("Delete course:", course.id);
              }}
            >
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      }
    />
  );
};

export default TeacherCourseCard;
