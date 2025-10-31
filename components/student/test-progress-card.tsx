import { Course } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Play } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const TestProgressCard = ({ course }: { course: Course }) => {
  return (
    <View className="px-6 mb-6">
      <Text className="text-lg font-bold text-gray-900 mb-3">
        Continue Learning
      </Text>
      <TouchableOpacity
        onPress={() => router.push(`/(student)/courses/${course.id}`)}
        activeOpacity={0.9}
        className="rounded-2xl overflow-hidden shadow-sm"
      >
        <LinearGradient
          colors={["#1890ff", "#0976e8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-5"
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1 pr-4">
              <Text className="text-white text-xl font-bold mb-1">
                {course.title}
              </Text>
              <Text className="text-blue-100 text-sm">
                {course.progress}% Complete • {course.totalTests} tests
              </Text>
            </View>
            <View className="bg-white/20 rounded-full p-3">
              <Play size={24} color="#fff" fill="#fff" />
            </View>
          </View>
          <View className="bg-white/20 rounded-full h-2 overflow-hidden">
            <View
              className="bg-white h-full rounded-full"
              style={{ width: `${course.progress ?? 0}%` }}
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

export default TestProgressCard;
