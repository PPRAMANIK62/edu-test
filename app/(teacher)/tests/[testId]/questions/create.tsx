import QuestionForm from "@/components/teacher/question-form";
import ScreenHeader from "@/components/teacher/screen-header";
import { MOCK_QUESTIONS, MOCK_TESTS } from "@/lib/mockdata";
import { mcqFormSchema, validateForm } from "@/lib/schemas";
import { MCQFormData, QuestionOption } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const createDefaultOptions = (): QuestionOption[] => [
  { id: `opt-${Date.now()}-a`, label: "A", text: "" },
  { id: `opt-${Date.now()}-b`, label: "B", text: "" },
  { id: `opt-${Date.now()}-c`, label: "C", text: "" },
  { id: `opt-${Date.now()}-d`, label: "D", text: "" },
];

export default function CreateQuestionScreen() {
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<MCQFormData>({
    text: "",
    subjectId: "",
    options: createDefaultOptions(),
    correctOptionId: "",
    explanation: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch test details to get subjects
  const { data: test, isLoading: isTestLoading } = useQuery({
    queryKey: ["test", testId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return MOCK_TESTS.find((t) => t.id === testId);
    },
  });

  // Get next order number
  const { data: existingQuestions } = useQuery({
    queryKey: ["questions", testId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return MOCK_QUESTIONS.filter((q) => q.testId === testId);
    },
  });

  const isDirty =
    formData.text ||
    formData.options.some((o) => o.text) ||
    formData.correctOptionId ||
    formData.explanation;

  const validate = (): boolean => {
    const { isValid, errors: validationErrors } = validateForm(
      mcqFormSchema,
      formData
    );
    setErrors(validationErrors);
    return isValid;
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const subject = test?.subjects.find((s) => s.id === formData.subjectId);
      const nextOrder = (existingQuestions?.length || 0) + 1;

      // Filter out empty options
      const validOptions = formData.options.filter((o) => o.text.trim());

      return {
        id: `q-${Date.now()}`,
        testId,
        subjectId: formData.subjectId,
        subjectName: subject?.name || "",
        type: "mcq" as const,
        text: formData.text.trim(),
        options: validOptions,
        correctOptionId: formData.correctOptionId,
        explanation: formData.explanation.trim(),
        order: nextOrder,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", testId] });
      Alert.alert("Success", "Question created successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    },
    onError: () => {
      Alert.alert("Error", "Failed to create question. Please try again.");
    },
  });

  const handleCreate = () => {
    if (validate()) {
      createMutation.mutate();
    }
  };

  const handleCancel = () => {
    if (isDirty) {
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

  if (isTestLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <ScreenHeader title="Create Question" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      </SafeAreaView>
    );
  }

  if (!test) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <ScreenHeader title="Create Question" />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-gray-500 text-center">Test not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader
        title="Create Question"
        subtitle={test.title}
        onBack={handleCancel}
      />

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="py-4">
          {/* Question type badge */}
          <View className="flex-row items-center mb-4">
            <View className="bg-violet-100 px-3 py-1.5 rounded-full">
              <Text className="text-violet-700 font-semibold text-sm">
                Multiple Choice (MCQ)
              </Text>
            </View>
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
              onPress={handleCreate}
              disabled={createMutation.isPending}
              className="bg-violet-600 rounded-xl py-4 items-center"
              activeOpacity={0.8}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">
                  Create Question
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCancel}
              disabled={createMutation.isPending}
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
