import ActionButton from "@/components/student/attempt/action-button";
import QuestionReviewCard from "@/components/student/attempt/question-review";
import ResultsOverview from "@/components/student/attempt/results-overview";
import { getAnswersFromAttempt, useAttempt } from "@/hooks/use-attempts";
import { useQuestionsByTest } from "@/hooks/use-questions";
import type { Question } from "@/types";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import type { Href } from "expo-router";
import React, { useMemo } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ReviewScreen = () => {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const router = useRouter();

  // Fetch attempt data with answers and results
  const { data: attemptData, isLoading: attemptLoading } =
    useAttempt(attemptId);

  // Fetch questions for the test
  const { data: questionsData, isLoading: questionsLoading } =
    useQuestionsByTest(attemptData?.test_id);

  // Compute review data from attempt and questions
  const reviewData = useMemo(() => {
    if (!attemptData || !questionsData?.documents) return null;

    const questions = questionsData.documents;
    const answers = getAnswersFromAttempt(attemptData);

    // Create answer map: questionIndex -> selectedIndex
    const answerMap = new Map<number, number>();
    for (const [questionIndex, selectedIndex] of answers) {
      answerMap.set(questionIndex, selectedIndex);
    }

    // Map questions with answer data
    const reviewQuestions: (Question & {
      selectedOptionId: string;
      isCorrect: boolean;
    })[] = questions.map((q, index) => {
      const selectedIndex = answerMap.get(index);
      const isCorrect =
        selectedIndex !== undefined && selectedIndex === q.correct_index;

      // Map options to the format expected by components
      const labels = ["A", "B", "C", "D"] as const;
      const options = q.options.map((text, optIndex) => ({
        id: `opt-${optIndex}`,
        label: labels[optIndex],
        text,
      }));

      return {
        id: q.id,
        type: "mcq" as const,
        test_id: q.test_id,
        subject_id: q.subject_id,
        subject_name: q.subject_name,
        text: q.text,
        options,
        correct_option_id: `opt-${q.correct_index}`,
        explanation: q.explanation,
        order: q.order,
        selectedOptionId:
          selectedIndex !== undefined ? `opt-${selectedIndex}` : "",
        isCorrect,
      };
    });

    const score = attemptData.score ?? 0;
    const total = questions.length;
    const percentage = attemptData.percentage ?? 0;
    const passed = attemptData.passed ?? false;

    return {
      score,
      total,
      percentage,
      passed,
      questions: reviewQuestions,
    };
  }, [attemptData, questionsData]);

  if (attemptLoading || questionsLoading || !reviewData) {
    return (
      <SafeAreaView
        className="flex-1 bg-white items-center justify-center"
        edges={["top"]}
      >
        <ActivityIndicator size="large" color="#1890ff" />
        <Text className="text-gray-500 mt-4">Loading review...</Text>
      </SafeAreaView>
    );
  }

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
            onPress={() => router.push("/(student)/(tabs)/dashboard" as Href)}
            variant="primary"
            label="Back to Dashboard"
          />
          <ActionButton
            onPress={() => router.push("/(student)/(tabs)/tests" as Href)}
            variant="secondary"
            label="Take Another Test"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReviewScreen;
