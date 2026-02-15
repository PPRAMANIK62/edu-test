import TestCardBase from "@/components/shared/test-card-base";
import { Test } from "@/types";
import { router } from "expo-router";
import { Trophy } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

type Props = {
  test: Test;
  courseName?: string;
};

const TestCard = ({ test, courseName }: Props) => {
  return (
    <TestCardBase
      title={test.title}
      description={test.description}
      totalQuestions={test.total_questions}
      durationMinutes={test.duration_minutes}
      onPress={() => router.push(`/(student)/test/${test.id}/intro`)}
      className="bg-white rounded-2xl p-4 shadow-sm mb-4"
      statsClassName="flex-row items-center gap-4 my-4"
      headerExtra={
        courseName ? (
          <Text className="text-sm text-primary-600 font-medium mb-1">
            {courseName}
          </Text>
        ) : undefined
      }
      stats={
        test.best_score ? (
          <View className="flex-row items-center">
            <Trophy size={16} color="#38a169" />
            <Text className="text-sm text-green-600 ml-1 font-semibold">
              {test.best_score}%
            </Text>
          </View>
        ) : undefined
      }
      action={
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-500">
            {test.attempt_count === 0
              ? "Not attempted yet"
              : `${test.attempt_count} attempt${test.attempt_count > 1 ? "s" : ""}`}
          </Text>
          <View className="bg-primary-600 rounded-lg px-4 py-2">
            <Text className="text-white font-semibold text-sm">Start Test</Text>
          </View>
        </View>
      }
    />
  );
};

export default TestCard;
