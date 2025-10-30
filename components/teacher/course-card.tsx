import { Course } from "@/types";
import { BookOpen, Edit3, Star, Trash2, Users } from "lucide-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

const TeacherCourseCard = ({ course }: { course: Course }) => {
  return (
    <View key={course.id} className="mb-4">
      <TouchableOpacity
        activeOpacity={0.9}
        className="bg-white rounded-2xl overflow-hidden shadow-sm"
        onPress={() => {
          console.log("View course details:", course.id);
        }}
      >
        <Image
          source={{ uri: course.imageUrl }}
          className="w-full h-40"
          resizeMode="cover"
        />
        <View className="p-4">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 pr-3">
              <Text
                className="text-gray-900 font-bold text-lg mb-1"
                numberOfLines={2}
              >
                {course.title}
              </Text>
              <Text className="text-gray-600 text-sm" numberOfLines={2}>
                {course.description}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-gray-100">
            <View className="flex-row items-center gap-1">
              <Users size={16} color="#6b7280" />
              <Text className="text-gray-700 font-semibold text-sm">
                {course.enrollmentCount}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Star size={16} color="#f59e0b" fill="#f59e0b" />
              <Text className="text-gray-700 font-semibold text-sm">
                {course.rating?.toFixed(1)}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <BookOpen size={16} color="#6b7280" />
              <Text className="text-gray-700 font-semibold text-sm">
                {course.totalTests} tests
              </Text>
            </View>
            <View className="flex-1" />
            <Text className="text-violet-600 font-bold text-base">
              ${course.price}
            </Text>
          </View>

          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity
              className="flex-1 bg-violet-600 rounded-xl py-3 flex-row items-center justify-center"
              activeOpacity={0.8}
              onPress={() => {
                console.log("Edit course:", course.id);
              }}
            >
              <Edit3 size={16} color="#fff" />
              <Text className="text-white font-semibold ml-2">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-red-50 rounded-xl px-4 py-3"
              activeOpacity={0.8}
              onPress={() => {
                console.log("Delete course:", course.id);
              }}
            >
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default TeacherCourseCard;
