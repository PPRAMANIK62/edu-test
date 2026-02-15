import { Test } from "@/types";
import { router } from "expo-router";
import type { Href } from "expo-router";
import { BookOpen, Clock, Edit2, FileQuestion } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface TeacherTestCardProps {
  test: Test;
}

const TeacherTestCard = ({ test }: TeacherTestCardProps) => {
  const handleManageQuestions = () => {
    router.push(`/(teacher)/tests/${test.id}/questions` as Href);
  };

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm mb-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text
            className="text-gray-900 font-bold text-base mb-1"
            numberOfLines={2}
          >
            {test.title}
          </Text>
          <Text className="text-gray-600 text-sm" numberOfLines={2}>
            {test.description}
          </Text>
        </View>
      </View>

      {/* Stats row */}
      <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <View className="flex-row items-center gap-1">
          <FileQuestion size={16} color="#6b7280" />
          <Text className="text-gray-700 font-medium text-sm">
            {test.total_questions} questions
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Clock size={16} color="#6b7280" />
          <Text className="text-gray-700 font-medium text-sm">
            {test.duration_minutes} min
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <BookOpen size={16} color="#6b7280" />
          <Text className="text-gray-700 font-medium text-sm">
            {test.subjects.length} subjects
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row gap-2 mt-3">
        <TouchableOpacity
          onPress={handleManageQuestions}
          className="flex-1 bg-violet-600 rounded-xl py-3 flex-row items-center justify-center"
          activeOpacity={0.8}
        >
          <Edit2 size={16} color="#fff" />
          <Text className="text-white font-semibold ml-2">
            Manage Questions
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TeacherTestCard;
