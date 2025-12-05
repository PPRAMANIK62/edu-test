import QuestionForm from "@/components/teacher/question-form";
import ScreenHeader from "@/components/teacher/screen-header";
import { MOCK_QUESTIONS, MOCK_TESTS } from "@/lib/mockdata";
import { MCQFormData, MCQQuestion } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditQuestionScreen() {
  const { testId, questionId } = useLocalSearchParams<{
    testId: string;
    questionId: string;
  }>();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<MCQFormData>({
    text: "",
    subjectId: "",
    options: [],
    correctOptionId: "",
    explanation: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch test details
  const { data: test, isLoading: isTestLoading } = useQuery({
    queryKey: ["test", testId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return MOCK_TESTS.find((t) => t.id === testId);
    },
  });

  // Fetch question details
  const { data: question, isLoading: isQuestionLoading } = useQuery({
    queryKey: ["question", questionId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return MOCK_QUESTIONS.find((q) => q.id === questionId) as
        | MCQQuestion
        | undefined;
    },
  });

  // Initialize form with existing data
  useEffect(() => {
    if (question && !isInitialized) {
      setFormData({
        text: question.text,
        subjectId: question.subjectId,
        options: [...question.options],
        correctOptionId: question.correctOptionId,
        explanation: question.explanation,
      });
      setIsInitialized(true);
    }
  }, [question, isInitialized]);

  const hasChanges = () => {
    if (!question) return false;
    return (
      formData.text !== question.text ||
      formData.subjectId !== question.subjectId ||
      formData.correctOptionId !== question.correctOptionId ||
      formData.explanation !== question.explanation ||
      JSON.stringify(formData.options) !== JSON.stringify(question.options)
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.text.trim()) {
      newErrors.text = "Question text is required";
    }

    if (!formData.subjectId) {
      newErrors.subjectId = "Please select a subject";
    }

    const filledOptions = formData.options.filter((o) => o.text.trim());
    if (filledOptions.length < 2) {
      newErrors.options = "At least 2 options are required";
    }

    if (!formData.correctOptionId) {
      newErrors.correctOptionId = "Please select the correct answer";
    } else {
      const correctOption = formData.options.find(
        (o) => o.id === formData.correctOptionId
      );
      if (!correctOption?.text.trim()) {
        newErrors.correctOptionId = "The correct answer option must have text";
      }
    }

    if (!formData.explanation.trim()) {
      newErrors.explanation = "Explanation is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const subject = test?.subjects.find((s) => s.id === formData.subjectId);
      const validOptions = formData.options.filter((o) => o.text.trim());

      return {
        ...question,
        subjectId: formData.subjectId,
        subjectName: subject?.name || question?.subjectName || "",
        text: formData.text.trim(),
        options: validOptions,
        correctOptionId: formData.correctOptionId,
        explanation: formData.explanation.trim(),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", testId] });
      queryClient.invalidateQueries({ queryKey: ["question", questionId] });
      Alert.alert("Success", "Question updated successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    },
    onError: () => {
      Alert.alert("Error", "Failed to update question. Please try again.");
    },
  });

  const handleUpdate = () => {
    if (validate()) {
      updateMutation.mutate();
    }
  };

  const handleCancel = () => {
    if (hasChanges()) {
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved changes. Are you sure you want to cancel?",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const isLoading = isTestLoading || isQuestionLoading;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <ScreenHeader title="Edit Question" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      </SafeAreaView>
    );
  }

  if (!test || !question) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <ScreenHeader title="Edit Question" />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-gray-500 text-center">
            {!test ? "Test not found" : "Question not found"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader
        title="Edit Question"
        subtitle={`Question ${question.order} • ${test.title}`}
        onBack={handleCancel}
      />

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="py-4">
          {/* Question type badge - read only */}
          <View className="flex-row items-center mb-4">
            <View className="bg-violet-100 px-3 py-1.5 rounded-full">
              <Text className="text-violet-700 font-semibold text-sm">
                Multiple Choice (MCQ)
              </Text>
            </View>
            <Text className="text-xs text-gray-500 ml-2">
              Type cannot be changed
            </Text>
          </View>

          <QuestionForm
            formData={formData}
            onFormDataChange={setFormData}
            subjects={test.subjects}
            errors={errors}
          />

          {/* Action buttons */}
          <View className="gap-3 mb-8">
            <TouchableOpacity
              onPress={handleUpdate}
              disabled={updateMutation.isPending || !hasChanges()}
              className={`rounded-xl py-4 items-center ${
                hasChanges() ? "bg-violet-600" : "bg-gray-300"
              }`}
              activeOpacity={0.8}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCancel}
              disabled={updateMutation.isPending}
              className="border border-gray-300 rounded-xl py-4 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-gray-700 font-semibold text-base">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
