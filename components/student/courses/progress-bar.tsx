import { Course } from "@/types";
import { Text, View } from "react-native";

const ProgressBar = ({ course }: { course: Course }) => {
  return (
    <View className="bg-gray-50 rounded-2xl p-4 mb-6">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-semibold text-gray-900">
          Your Progress
        </Text>
        <Text className="text-lg font-bold text-primary-600">
          {course.progress}%
        </Text>
      </View>
      <View className="bg-gray-200 rounded-full h-3 overflow-hidden">
        <View
          className="bg-primary-600 h-full rounded-full"
          style={{ width: `${course.progress ?? 0}%` }}
        />
      </View>
    </View>
  );
};

export default ProgressBar;
