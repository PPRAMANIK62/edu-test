import FormInput from "@/components/teacher/form-input";
import FormSection from "@/components/teacher/form-section";
import ImagePicker from "@/components/teacher/image-picker";
import ScreenHeader from "@/components/teacher/screen-header";
import SubjectPicker from "@/components/teacher/subject-picker";
import { useAppwrite } from "@/hooks/use-appwrite";
import { isTeacher } from "@/lib/permissions";
import { courseFormSchema, validateForm } from "@/lib/schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
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

const CreateCourse = () => {
  const { userProfile } = useAppwrite();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [estimatedHours, setEstimatedHours] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect TAs - only teachers can create courses
  useEffect(() => {
    if (userProfile && !isTeacher(userProfile.role)) {
      Alert.alert(
        "Access Denied",
        "You don't have permission to create courses.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      );
    }
  }, [userProfile]);

  const isDirty =
    title ||
    description ||
    price ||
    subjects.length > 0 ||
    estimatedHours ||
    imageUri;

  const validate = () => {
    const { isValid, errors: validationErrors } = validateForm(
      courseFormSchema,
      { title, description, price, subjects, estimatedHours, imageUri },
    );
    setErrors(validationErrors);
    return isValid;
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        id: `course-${Date.now()}`,
        title,
        description,
        price: parseFloat(price),
        subjects,
        estimatedHours: estimatedHours ? parseInt(estimatedHours) : 10,
        imageUrl:
          imageUri ||
          "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800",
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-courses"] });
      Alert.alert("Success", "Course created successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    },
    onError: () => {
      Alert.alert("Error", "Failed to create course. Please try again.");
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
        ],
      );
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader title="Create Course" onBack={handleCancel} />
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="py-4">
          <FormSection title="Basic Information">
            <FormInput
              label="Course Title"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Complete SAT Math Preparation"
              error={errors.title}
            />
            <FormInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what students will learn..."
              error={errors.description}
              multiline
            />
            <FormInput
              label="Price (INR)"
              value={price}
              onChangeText={setPrice}
              placeholder="499"
              error={errors.price}
              keyboardType="numeric"
            />
          </FormSection>

          <FormSection title="Course Details">
            <SubjectPicker
              label="Subjects Covered"
              subjects={subjects}
              onSubjectsChange={setSubjects}
            />
            <FormInput
              label="Estimated Hours"
              value={estimatedHours}
              onChangeText={setEstimatedHours}
              placeholder="24"
              keyboardType="numeric"
            />
            <ImagePicker
              label="Course Image"
              imageUri={imageUri}
              onImageSelected={setImageUri}
              onImageRemoved={() => setImageUri(null)}
            />
          </FormSection>

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
                  Create Course
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
};

export default CreateCourse;
