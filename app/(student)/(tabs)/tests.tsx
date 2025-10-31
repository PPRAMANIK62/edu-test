import TestCard from "@/components/student/test-card";
import { MOCK_COURSES, MOCK_TESTS } from "@/lib/mockdata";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FileText } from "lucide-react-native";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TestsTab = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: availableTests } = useQuery({
    queryKey: ["available-tests"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const purchasedCourseIds = MOCK_COURSES.filter((c) => c.isPurchased).map(
        (c) => c.id
      );
      return MOCK_TESTS.filter((t) => purchasedCourseIds.includes(t.courseId));
    },
  });

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-4" style={{ paddingTop: insets.top + 24 }}>
          <Text className="text-3xl font-bold text-gray-900 mb-2">Tests</Text>
          <Text className="text-base text-gray-600">
            Practice and improve your skills
          </Text>
        </View>

        <View className="px-6 pb-6">
          {availableTests?.map((test) => (
            <TestCard key={test.id} test={test} />
          ))}

          {availableTests?.length === 0 && (
            <View className="items-center justify-center py-20">
              <FileText size={64} color="#d1d5db" />
              <Text className="text-gray-500 text-lg font-semibold mt-4 mb-2">
                No tests available
              </Text>
              <Text className="text-gray-400 text-center mb-6">
                Purchase a course to access tests
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(student)/(tabs)/browse")}
                className="bg-primary-600 rounded-xl px-6 py-3"
              >
                <Text className="text-white font-semibold">Browse Courses</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default TestsTab;
