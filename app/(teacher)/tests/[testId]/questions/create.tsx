import QuestionForm from "@/components/teacher/question-form";
import ScreenHeader from "@/components/teacher/screen-header";
import { useCreateQuestion, useQuestionsByTest } from "@/hooks/use-questions";
import { useTestWithSubjects } from "@/hooks/use-tests";
import { mcqFormSchema, validateForm } from "@/lib/schemas";
import { MCQFormData, QuestionOption } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
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

const createDefaultOptions = (): QuestionOption[] => [
  { id: `opt-${Date.now()}-a`, label: "A", text: "" },
  { id: `opt-${Date.now()}-b`, label: "B", text: "" },
  { id: `opt-${Date.now()}-c`, label: "C", text: "" },
  { id: `opt-${Date.now()}-d`, label: "D", text: "" },
];

export default function CreateQuestionScreen() {
  const { testId } = useLocalSearchParams<{ testId: string }>();

  const [formData, setFormData] = useState<MCQFormData>({
    text: "",
    subjectId: "",
    options: createDefaultOptions(),
    correctOptionId: "",
    explanation: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch test details with subjects from database
  const { data: testData, isLoading: isTestLoading } =
    useTestWithSubjects(testId);

  // Transform test data for display
  const test = useMemo(() => {
    if (!testData) return null;
    return {
      id: testData.test.$id,
      title: testData.test.title,
      subjects: testData.subjects.map((s) => ({
        id: s.$id,
        name: s.name,
        questionCount: s.questionCount || 0,
      })),
    };
  }, [testData]);

  // Get existing questions to determine next order number
  const { data: existingQuestionsData } = useQuestionsByTest(testId);
  const existingQuestions = useMemo(() => {
    return existingQuestionsData?.documents || [];
  }, [existingQuestionsData]);

  // Use create mutation hook
  const createMutation = useCreateQuestion();

  const isDirty =
    formData.text ||
    formData.options.some((o) => o.text) ||
    formData.correctOptionId ||
    formData.explanation;

  const validate = (): boolean => {
    const { isValid, errors: validationErrors } = validateForm(
      mcqFormSchema,
      formData,
    );
    setErrors(validationErrors);
    return isValid;
  };

  const handleCreate = () => {
    if (!validate() || !test) return;

    const subject = test.subjects.find((s) => s.id === formData.subjectId);
    const nextOrder = (existingQuestions?.length || 0) + 1;

    // Filter out empty options
    const validOptions = formData.options.filter((o) => o.text.trim());

    createMutation.mutate(
      {
        testId: testId,
        subjectId: formData.subjectId,
        subjectName: subject?.name || "",
        type: "mcq",
        text: formData.text.trim(),
        options: JSON.stringify(validOptions),
        correctOptionId: formData.correctOptionId,
        explanation: formData.explanation.trim(),
        order: nextOrder,
      },
      {
        onSuccess: () => {
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
      },
    );
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
        ],
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
