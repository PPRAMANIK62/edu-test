import QuestionForm from "@/components/teacher/question-form";
import ScreenHeader from "@/components/teacher/screen-header";
import { useQuestion, useUpdateQuestion } from "@/hooks/use-questions";
import { useTestWithSubjects } from "@/hooks/use-tests";
import { mcqFormSchema, validateForm } from "@/lib/schemas";
import { MCQFormData, MCQQuestion, QuestionOption } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

  const [formData, setFormData] = useState<MCQFormData>({
    text: "",
    subjectId: "",
    options: [],
    correctOptionId: "",
    explanation: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch test details from database
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

  // Fetch question details from database
  const { data: questionData, isLoading: isQuestionLoading } =
    useQuestion(questionId);

  // Transform question data for display
  const question = useMemo(() => {
    if (!questionData) return null;
    return {
      id: questionData.$id,
      testId: questionData.testId,
      subjectId: questionData.subjectId,
      subjectName: questionData.subjectName,
      type: questionData.type as "mcq",
      text: questionData.text,
      options: JSON.parse(questionData.options || "[]") as QuestionOption[],
      correctOptionId: questionData.correctOptionId,
      explanation: questionData.explanation,
      order: questionData.order,
    } as MCQQuestion;
  }, [questionData]);

  // Use update mutation hook
  const updateMutation = useUpdateQuestion();

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
    const { isValid, errors: validationErrors } = validateForm(
      mcqFormSchema,
      formData
    );
    setErrors(validationErrors);
    return isValid;
  };

  const handleUpdate = () => {
    if (!validate() || !question || !test) return;

    const subject = test.subjects.find((s) => s.id === formData.subjectId);
    const validOptions = formData.options.filter((o) => o.text.trim());

    updateMutation.mutate(
      {
        questionId: questionId,
        testId: testId,
        data: {
          subjectId: formData.subjectId,
          subjectName: subject?.name || question.subjectName || "",
          text: formData.text.trim(),
          options: JSON.stringify(validOptions),
          correctOptionId: formData.correctOptionId,
          explanation: formData.explanation.trim(),
        },
      },
      {
        onSuccess: () => {
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
      }
    );
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
