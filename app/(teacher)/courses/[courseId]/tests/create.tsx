import FormInput from "@/components/teacher/form-input";
import FormSection from "@/components/teacher/form-section";
import ScreenHeader from "@/components/teacher/screen-header";
import { MOCK_COURSES } from "@/lib/mockdata";
import { TestFormData, testFormSchema, validateForm } from "@/lib/schemas";
import { Subject } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Plus, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateTestScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<TestFormData>({
    title: "",
    description: "",
    durationMinutes: "60",
    passingScore: "70",
    subjects: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newSubjectName, setNewSubjectName] = useState("");

  // Fetch course details
  const { data: course, isLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return MOCK_COURSES.find((c) => c.id === courseId);
    },
  });

  const isDirty =
    formData.title ||
    formData.description ||
    formData.subjects.length > 0 ||
    formData.durationMinutes !== "60" ||
    formData.passingScore !== "70";

  const validate = (): boolean => {
    const { isValid, errors: validationErrors } = validateForm(
      testFormSchema,
      formData
    );
    setErrors(validationErrors);
    return isValid;
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        id: `test-${Date.now()}`,
        courseId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        durationMinutes: parseInt(formData.durationMinutes),
        totalQuestions: 0,
        subjects: formData.subjects,
        passingScore: parseInt(formData.passingScore),
        attemptCount: 0,
        isAvailable: false,
      };
    },
    onSuccess: (newTest) => {
      queryClient.invalidateQueries({ queryKey: ["course-tests", courseId] });
      queryClient.invalidateQueries({ queryKey: ["teacher-courses"] });
      Alert.alert("Success", "Test created successfully!", [
        {
          text: "Add Questions",
          onPress: () => {
            router.replace(`/(teacher)/tests/${newTest.id}/questions` as any);
          },
        },
        {
          text: "Done",
          onPress: () => router.back(),
        },
      ]);
    },
    onError: () => {
      Alert.alert("Error", "Failed to create test. Please try again.");
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

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;

    const newSubject: Subject = {
      id: `subj-${Date.now()}`,
      name: newSubjectName.trim(),
      questionCount: 0,
    };

    setFormData({
      ...formData,
      subjects: [...formData.subjects, newSubject],
    });
    setNewSubjectName("");
    setErrors({ ...errors, subjects: "" });
  };

  const handleRemoveSubject = (subjectId: string) => {
    setFormData({
      ...formData,
      subjects: formData.subjects.filter((s) => s.id !== subjectId),
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <ScreenHeader title="Create Test" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <ScreenHeader title="Create Test" />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-gray-500 text-center">Course not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader
        title="Create Test"
        subtitle={course.title}
        onBack={handleCancel}
      />

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="py-4">
          <FormSection title="Test Information">
            <FormInput
              label="Test Title"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="e.g., Chapter 1 Quiz"
              error={errors.title}
            />
            <FormInput
              label="Description"
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              placeholder="Describe what this test covers..."
              error={errors.description}
              multiline
            />
          </FormSection>

          <FormSection title="Test Settings">
            <FormInput
              label="Duration (minutes)"
              value={formData.durationMinutes}
              onChangeText={(text) =>
                setFormData({ ...formData, durationMinutes: text })
              }
              placeholder="60"
              error={errors.durationMinutes}
              keyboardType="numeric"
            />
            <FormInput
              label="Passing Score (%)"
              value={formData.passingScore}
              onChangeText={(text) =>
                setFormData({ ...formData, passingScore: text })
              }
              placeholder="70"
              error={errors.passingScore}
              keyboardType="numeric"
            />
          </FormSection>

          <FormSection title="Subjects">
            <Text className="text-sm text-gray-600 mb-3">
              Add subjects/topics that will be covered in this test. Questions
              will be organized by subject.
            </Text>

            {/* Subject list */}
            {formData.subjects.length > 0 && (
              <View className="gap-2 mb-4">
                {formData.subjects.map((subject) => (
                  <View
                    key={subject.id}
                    className="flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                  >
                    <Text className="text-gray-900 font-medium">
                      {subject.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveSubject(subject.id)}
                      className="p-1"
                      activeOpacity={0.7}
                    >
                      <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Add subject input */}
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <TextInput
                  value={newSubjectName}
                  onChangeText={setNewSubjectName}
                  placeholder="Enter subject name"
                  className="border border-gray-300 rounded-xl p-3 text-base text-gray-900 bg-white"
                  placeholderTextColor="#9ca3af"
                  onSubmitEditing={handleAddSubject}
                  returnKeyType="done"
                />
              </View>
              <TouchableOpacity
                onPress={handleAddSubject}
                disabled={!newSubjectName.trim()}
                className={`p-3 rounded-xl ${
                  newSubjectName.trim() ? "bg-violet-600" : "bg-gray-200"
                }`}
                activeOpacity={0.7}
              >
                <Plus
                  size={20}
                  color={newSubjectName.trim() ? "#fff" : "#9ca3af"}
                />
              </TouchableOpacity>
            </View>

            {errors.subjects && (
              <Text className="text-red-500 text-sm mt-2">
                {errors.subjects}
              </Text>
            )}
          </FormSection>

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
                  Create Test
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
