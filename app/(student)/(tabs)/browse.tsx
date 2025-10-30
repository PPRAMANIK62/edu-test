import BrowseCard from "@/components/student/browse-card";
import { MOCK_COURSES } from "@/lib/mockdata";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BrowseTab() {
  const insets = useSafeAreaInsets();

  const { data: courses } = useQuery({
    queryKey: ["browse-courses"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_COURSES;
    },
  });

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-4" style={{ paddingTop: insets.top + 24 }}>
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Browse Courses
          </Text>
          <Text className="text-base text-gray-600">
            Discover courses to advance your learning
          </Text>
        </View>

        <View className="px-6 pb-6">
          {courses?.map((course) => (
            <BrowseCard key={course.id} course={course} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
