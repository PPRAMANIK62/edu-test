import ScreenHeader from "@/components/teacher/screen-header";
import {
  useDeleteQuestion,
  useQuestionsByTest,
  useReorderQuestions,
} from "@/hooks/use-questions";
import { useTest } from "@/hooks/use-tests";
import { Question, QuestionOption } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import type { Href } from "expo-router";
import { ArrowDown, ArrowUp, Edit2, Plus, Trash2 } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function QuestionListScreen() {
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  // Fetch test details from database
  const { data: test } = useTest(testId);

  // Fetch questions from database
  const { data: questionsData, isLoading } = useQuestionsByTest(testId);

  // Transform questions for display
  const questions = useMemo(() => {
    if (!questionsData?.documents) return [];

    const labels = ["A", "B", "C", "D", "E", "F"] as const;
    return questionsData.documents
      .map((q) => ({
        id: q.$id,
        testId: q.testId,
        subjectId: q.subjectId,
        subjectName: q.subjectName,
        type: q.type as "mcq",
        text: q.text,
        options: q.options.map((text, i) => ({
          id: `opt-${i}`,
          label: labels[i] || "A",
          text,
        })) as QuestionOption[],
        correctOptionId: `opt-${q.correctIndex}`,
        explanation: q.explanation,
        order: q.order,
      }))
      .sort((a, b) => a.order - b.order);
  }, [questionsData]);

  // Use mutation hooks
  const deleteQuestionMutation = useDeleteQuestion();
  const reorderMutation = useReorderQuestions();

  const handleDeleteQuestion = (question: Question) => {
    Alert.alert(
      "Delete Question",
      `Are you sure you want to delete question ${question.order}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            deleteQuestionMutation.mutate(
              { questionId: question.id, testId: testId },
              {
                onSuccess: () =>
                  Alert.alert("Success", "Question deleted successfully"),
                onError: () =>
                  Alert.alert("Error", "Failed to delete question"),
              },
            ),
        },
      ],
    );
  };

  const handleMoveQuestion = (questionId: string, direction: "up" | "down") => {
    setReorderingId(questionId);

    // Find current and target questions
    const currentIndex = questions.findIndex((q) => q.id === questionId);
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= questions.length) {
      setReorderingId(null);
      return;
    }

    // Create new order by swapping
    const newOrder = [...questions];
    [newOrder[currentIndex], newOrder[targetIndex]] = [
      newOrder[targetIndex],
      newOrder[currentIndex],
    ];
    const questionIds = newOrder.map((q) => q.id);

    // Reorder questions
    reorderMutation.mutate(
      { testId, questionIds },
      {
        onSuccess: () => setReorderingId(null),
        onError: () => {
          Alert.alert("Error", "Failed to reorder question");
          setReorderingId(null);
        },
      },
    );
  };

  const handleEditQuestion = (questionId: string) => {
    router.push(
      `/(teacher)/tests/${testId}/questions/${questionId}/edit` as Href,
    );
  };

  const handleCreateQuestion = () => {
    router.push(`/(teacher)/tests/${testId}/questions/create` as Href);
  };

  const getQuestionTypeBadge = (question: Question) => {
    return (
      <View className="bg-violet-100 px-2 py-1 rounded-full">
        <Text className="text-xs font-medium text-violet-700">MCQ</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <ScreenHeader title="Questions" subtitle={test?.title} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <ScreenHeader
        title="Questions"
        subtitle={test?.title}
        rightComponent={
          <TouchableOpacity
            onPress={handleCreateQuestion}
            className="bg-violet-600 p-2 rounded-full"
            activeOpacity={0.7}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        }
      />

      <ScrollView className="flex-1 px-4 py-4">
        {!questions || questions.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center">
            <Text className="text-gray-500 text-center mb-4">
              No questions yet. Add your first question to get started.
            </Text>
            <TouchableOpacity
              onPress={handleCreateQuestion}
              className="bg-violet-600 px-6 py-3 rounded-xl flex-row items-center"
              activeOpacity={0.8}
            >
              <Plus size={20} color="#fff" />
              <Text className="text-white font-semibold ml-2">
                Add Question
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="gap-3">
            {questions.map((question, index) => (
              <View
                key={question.id}
                className="bg-white rounded-2xl p-4 shadow-sm"
              >
                {/* Header row */}
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <View className="bg-gray-100 w-8 h-8 rounded-full items-center justify-center">
                      <Text className="text-gray-700 font-bold text-sm">
                        {question.order}
                      </Text>
                    </View>
                    {getQuestionTypeBadge(question)}
                    <Text className="text-xs text-gray-500">
                      {question.subjectName}
                    </Text>
                  </View>

                  {/* Action buttons */}
                  <View className="flex-row items-center gap-1">
                    {/* Move up */}
                    <TouchableOpacity
                      onPress={() => handleMoveQuestion(question.id, "up")}
                      disabled={index === 0 || reorderingId === question.id}
                      className={`p-2 ${index === 0 ? "opacity-30" : ""}`}
                      activeOpacity={0.7}
                    >
                      <ArrowUp
                        size={18}
                        color={index === 0 ? "#d1d5db" : "#6b7280"}
                      />
                    </TouchableOpacity>

                    {/* Move down */}
                    <TouchableOpacity
                      onPress={() => handleMoveQuestion(question.id, "down")}
                      disabled={
                        index === questions.length - 1 ||
                        reorderingId === question.id
                      }
                      className={`p-2 ${
                        index === questions.length - 1 ? "opacity-30" : ""
                      }`}
                      activeOpacity={0.7}
                    >
                      <ArrowDown
                        size={18}
                        color={
                          index === questions.length - 1 ? "#d1d5db" : "#6b7280"
                        }
                      />
                    </TouchableOpacity>

                    {/* Edit */}
                    <TouchableOpacity
                      onPress={() => handleEditQuestion(question.id)}
                      className="p-2"
                      activeOpacity={0.7}
                    >
                      <Edit2 size={18} color="#7c3aed" />
                    </TouchableOpacity>

                    {/* Delete */}
                    <TouchableOpacity
                      onPress={() => handleDeleteQuestion(question)}
                      className="p-2"
                      activeOpacity={0.7}
                    >
                      <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Question text */}
                <Text
                  className="text-gray-900 text-base leading-6"
                  numberOfLines={3}
                >
                  {question.text}
                </Text>

                {/* Options preview */}
                {question.type === "mcq" && (
                  <View className="mt-3 flex-row flex-wrap gap-2">
                    {question.options.map((option: QuestionOption) => (
                      <View
                        key={option.id}
                        className={`px-3 py-1 rounded-full ${
                          option.id === question.correctOptionId
                            ? "bg-green-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <Text
                          className={`text-xs ${
                            option.id === question.correctOptionId
                              ? "text-green-700 font-semibold"
                              : "text-gray-600"
                          }`}
                        >
                          {option.label}: {option.text}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Summary footer */}
        {questions && questions.length > 0 && (
          <View className="mt-6 mb-8 p-4 bg-white rounded-2xl">
            <Text className="text-gray-700 font-semibold mb-2">Summary</Text>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Total Questions</Text>
              <Text className="text-gray-900 font-medium">
                {questions.length}
              </Text>
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-gray-600">MCQ Questions</Text>
              <Text className="text-gray-900 font-medium">
                {questions.filter((q) => q.type === "mcq").length}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
