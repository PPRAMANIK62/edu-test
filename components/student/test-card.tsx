import { Test } from "@/types";
import { router } from "expo-router";
import { Clock, FileText, Trophy } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  test: Test;
  courseName?: string;
};

const TestCard = ({ test, courseName }: Props) => {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(student)/test/${test.id}/intro`)}
      activeOpacity={0.9}
      className="bg-white rounded-2xl p-4 shadow-sm mb-4"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          {courseName && (
            <Text className="text-sm text-primary-600 font-medium mb-1">
              {courseName}
            </Text>
          )}
          <Text className="text-lg font-bold text-gray-900 mb-1">
            {test.title}
          </Text>
          <Text className="text-sm text-gray-600 leading-5" numberOfLines={2}>
            {test.description}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-4 my-4">
        <View className="flex-row items-center">
          <FileText size={16} color="#6b7280" />
          <Text className="text-sm text-gray-600 ml-1">
            {test.totalQuestions} questions
          </Text>
        </View>
        <View className="flex-row items-center">
          <Clock size={16} color="#6b7280" />
          <Text className="text-sm text-gray-600 ml-1">
            {test.durationMinutes} min
          </Text>
        </View>
        {test.bestScore && (
          <View className="flex-row items-center">
            <Trophy size={16} color="#38a169" />
            <Text className="text-sm text-green-600 ml-1 font-semibold">
              {test.bestScore}%
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-gray-500">
          {test.attemptCount === 0
            ? "Not attempted yet"
            : `${test.attemptCount} attempt${test.attemptCount > 1 ? "s" : ""}`}
        </Text>
        <View className="bg-primary-600 rounded-lg px-4 py-2">
          <Text className="text-white font-semibold text-sm">Start Test</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default TestCard;
