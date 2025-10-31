import { Course } from "@/types";
import { router } from "expo-router";
import { Clock, FileText } from "lucide-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

const StudentCourseCard = ({ course }: { course: Course }) => {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(student)/courses/${course.id}`)}
      activeOpacity={0.9}
      className="bg-white rounded-2xl overflow-hidden shadow-sm mb-4"
    >
      <Image
        source={{ uri: course.imageUrl }}
        className="w-full h-48"
        resizeMode="cover"
      />
      <View className="p-4">
        <Text className="text-xl font-bold text-gray-900 mb-2">
          {course.title}
        </Text>
        <Text
          className="text-sm text-gray-600 mb-4 leading-5"
          numberOfLines={2}
        >
          {course.description}
        </Text>

        <View className="flex-row items-center gap-4 mb-4">
          <View className="flex-row items-center">
            <FileText size={16} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-1">
              {course.totalTests} tests
            </Text>
          </View>
          <View className="flex-row items-center">
            <Clock size={16} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-1">
              {course.estimatedHours}h
            </Text>
          </View>
        </View>

        {course.progress && (
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
        )}
      </View>
    </TouchableOpacity>
  );
};

export default StudentCourseCard;
