import ActionButton from "@/components/student/attempt/action-button";
import QuestionReviewCard from "@/components/student/attempt/question-review";
import ResultsOverview from "@/components/student/attempt/results-overview";
import { MOCK_QUESTIONS } from "@/lib/mockdata";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ReviewScreen = () => {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const router = useRouter();

  const { data: reviewData } = useQuery({
    queryKey: ["review", attemptId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const correctCount = 4;
      const totalQuestions = MOCK_QUESTIONS.length;
      const percentage = Math.round((correctCount / totalQuestions) * 100);

      return {
        score: correctCount,
        total: totalQuestions,
        percentage,
        passed: percentage >= 70,
        questions: MOCK_QUESTIONS.map((q, idx) => ({
          ...q,
          selectedOptionId: idx < 4 ? q.correctOptionId : q.options[0].id,
          isCorrect: idx < 4,
        })),
      };
    },
  });

  if (!reviewData) return null;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <Stack.Screen />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <ResultsOverview reviewData={reviewData} />

        <View className="p-6">
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            Question Review
          </Text>

          {reviewData.questions.map((question, index) => (
            <QuestionReviewCard
              key={question.id}
              question={question}
              index={index}
            />
          ))}
        </View>

        <View className="px-6 pb-8 gap-3">
          <ActionButton
            onPress={() => router.push("/(student)/(tabs)/dashboard" as any)}
            variant="primary"
            label="Back to Dashboard"
          />
          <ActionButton
            onPress={() => router.push("/(student)/(tabs)/tests" as any)}
            variant="secondary"
            label="Take Another Test"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReviewScreen;
