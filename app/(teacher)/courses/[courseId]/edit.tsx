import FormInput from "@/components/teacher/form-input";
import FormSection from "@/components/teacher/form-section";
import ImagePicker from "@/components/teacher/image-picker";
import ScreenHeader from "@/components/teacher/screen-header";
import SubjectPicker from "@/components/teacher/subject-picker";
import TeacherTestCard from "@/components/teacher/test-card";
import { useAppwrite } from "@/hooks/use-appwrite";
import {
  useCourse,
  useDeleteCourse,
  useUpdateCourse,
} from "@/hooks/use-courses";
import { useTestsByCourse } from "@/hooks/use-tests";
import { isTA, isTeacher } from "@/lib/permissions";
import { courseFormSchema, validateForm } from "@/lib/schemas";
import { router, useLocalSearchParams } from "expo-router";
import { Plus } from "lucide-react-native";
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

const EditCourse = () => {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { userProfile } = useAppwrite();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [estimatedHours, setEstimatedHours] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialValues, setInitialValues] = useState<any>(null);

  // Fetch course from database
  const { data: course, isLoading } = useCourse(courseId);

  // Fetch tests for this course from database
  const { data: testsData } = useTestsByCourse(courseId);

  // Transform tests data for TeacherTestCard
  const tests = useMemo(() => {
    if (!testsData?.documents) return [];

    return testsData.documents.map((test) => ({
      id: test.$id,
      courseId: test.courseId,
      title: test.title,
      description: test.description,
      durationMinutes: test.durationMinutes,
      totalQuestions: 0, // Would come from questions count
      subjects: [], // Would come from test_subjects
      passingScore: test.passingScore,
      attemptCount: 0,
      isAvailable: test.isPublished,
    }));
  }, [testsData]);

  // Use mutation hooks for update and delete
  const updateMutation = useUpdateCourse();
  const deleteMutation = useDeleteCourse();

  useEffect(() => {
    if (course && !initialValues) {
      const values = {
        title: course.title,
        description: course.description,
        price: course.price.toString(),
        subjects: course.subjects,
        estimatedHours: course.estimatedHours.toString(),
        imageUri: course.imageUrl || null,
      };
      setTitle(values.title);
      setDescription(values.description);
      setPrice(values.price);
      setSubjects(values.subjects);
      setEstimatedHours(values.estimatedHours.toString());
      setImageUri(values.imageUri);
      setInitialValues(values);
    }
  }, [course, initialValues]);

  // Check if user can edit courses
  useEffect(() => {
    if (
      userProfile &&
      !isTeacher(userProfile.role) &&
      !isTA(userProfile.role)
    ) {
      Alert.alert(
        "Access Denied",
        "You don't have permission to edit courses.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    }
  }, [userProfile]);

  const isDirty =
    initialValues &&
    (title !== initialValues.title ||
      description !== initialValues.description ||
      price !== initialValues.price ||
      JSON.stringify(subjects) !== JSON.stringify(initialValues.subjects) ||
      estimatedHours !== initialValues.estimatedHours ||
      imageUri !== initialValues.imageUri);

  const validate = () => {
    const { isValid, errors: validationErrors } = validateForm(
      courseFormSchema,
      { title, description, price, subjects, estimatedHours, imageUri }
    );
    setErrors(validationErrors);
    return isValid;
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Course",
      "Are you sure you want to delete this course? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (!courseId) return;
            deleteMutation.mutate(courseId, {
              onSuccess: () => {
                Alert.alert("Success", "Course deleted successfully!", [
                  {
                    text: "OK",
                    onPress: () => router.replace("/(teacher)/(tabs)/courses"),
                  },
                ]);
              },
              onError: () => {
                Alert.alert(
                  "Error",
                  "Failed to delete course. Please try again."
                );
              },
            });
          },
        },
      ]
    );
  };

  const handleUpdate = () => {
    if (validate() && courseId) {
      updateMutation.mutate(
        {
          courseId,
          data: {
            title,
            description,
            price: parseFloat(price),
            subjects,
            estimatedHours: estimatedHours ? parseInt(estimatedHours) : 10,
            imageUrl:
              imageUri ||
              "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800",
          },
        },
        {
          onSuccess: () => {
            Alert.alert("Success", "Course updated successfully!", [
              {
                text: "OK",
                onPress: () => router.back(),
              },
            ]);
          },
          onError: () => {
            Alert.alert("Error", "Failed to update course. Please try again.");
          },
        }
      );
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

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-white items-center justify-center"
        edges={["top"]}
      >
        <ScreenHeader title="Edit Course" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <ScreenHeader title="Edit Course" />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-900 font-bold text-xl mb-2">
            Course Not Found
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            The course you&apos;re trying to edit doesn&apos;t exist.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-violet-600 rounded-xl px-6 py-3"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader title="Edit Course" onBack={handleCancel} />
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
              label="Price (USD)"
              value={price}
              onChangeText={setPrice}
              placeholder="49.99"
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

          {/* Tests Section */}
          <FormSection title="Course Tests">
            {tests && tests.length > 0 ? (
              <View className="gap-3">
                {tests.map((test) => (
                  <TeacherTestCard key={test.id} test={test} />
                ))}
              </View>
            ) : (
              <View className="bg-gray-50 rounded-xl p-6 items-center">
                <Text className="text-gray-500 text-center">
                  No tests created for this course yet.
                </Text>
              </View>
            )}

            {/* Add Test Button */}
            <TouchableOpacity
              onPress={() =>
                router.push(
                  `/(teacher)/courses/${courseId}/tests/create` as any
                )
              }
              className="mt-4 border-2 border-dashed border-violet-300 rounded-xl py-4 flex-row items-center justify-center bg-violet-50"
              activeOpacity={0.7}
            >
              <Plus size={20} color="#7c3aed" />
              <Text className="text-violet-600 font-semibold ml-2">
                Add New Test
              </Text>
            </TouchableOpacity>
          </FormSection>

          <View className="gap-3 mb-8">
            <TouchableOpacity
              onPress={handleUpdate}
              disabled={updateMutation.isPending}
              className="bg-violet-600 rounded-xl py-4 items-center"
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

          {/* Delete Course Button - Only for teachers */}
          {userProfile && isTeacher(userProfile.role) && (
            <TouchableOpacity
              onPress={handleDelete}
              disabled={deleteMutation.isPending}
              className="border border-red-300 bg-red-50 rounded-xl py-4 items-center mt-4"
              activeOpacity={0.8}
            >
              {deleteMutation.isPending ? (
                <ActivityIndicator color="#ef4444" />
              ) : (
                <Text className="text-red-600 font-semibold text-base">
                  Delete Course
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
export default EditCourse;
