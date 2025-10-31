import { Test } from "@/types";
import { router } from "expo-router";
import { Clock, FileText, Lock, Play, Trophy } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  test: Test;
  isPurchased: boolean;
};

const CoursesTestCard = ({ test, isPurchased }: Props) => {
  if (!isPurchased) {
    return (
      <View className="bg-gray-100 rounded-xl p-4 border border-gray-200">
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900 mb-1">
              {test.title}
            </Text>
            <Text className="text-sm text-gray-600" numberOfLines={2}>
              {test.description}
            </Text>
          </View>
          <View className="bg-gray-400 rounded-full p-2 ml-3">
            <Lock size={16} color="#fff" />
          </View>
        </View>

        <View className="flex-row items-center gap-4 mb-3">
          <View className="flex-row items-center">
            <FileText size={14} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-1">
              {test.totalQuestions} Q
            </Text>
          </View>
          <View className="flex-row items-center">
            <Clock size={14} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-1">
              {test.durationMinutes} min
            </Text>
          </View>
        </View>

        <View className="bg-gray-200 rounded-lg py-2 px-3">
          <Text className="text-gray-600 text-sm text-center font-medium">
            Purchase course to access
          </Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      key={test.id}
      onPress={() => router.push(`/(student)/test/${test.id}/intro`)}
      activeOpacity={0.9}
      className="bg-gray-50 rounded-xl p-4"
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900 mb-1">
            {test.title}
          </Text>
          <Text className="text-sm text-gray-600" numberOfLines={2}>
            {test.description}
          </Text>
        </View>
        <View className="bg-primary-600 rounded-full p-2 ml-3">
          <Play size={16} color="#fff" fill="#fff" />
        </View>
      </View>

      <View className="flex-row items-center gap-4">
        <View className="flex-row items-center">
          <FileText size={14} color="#6b7280" />
          <Text className="text-sm text-gray-600 ml-1">
            {test.totalQuestions} Q
          </Text>
        </View>
        <View className="flex-row items-center">
          <Clock size={14} color="#6b7280" />
          <Text className="text-sm text-gray-600 ml-1">
            {test.durationMinutes} min
          </Text>
        </View>
        {test.bestScore && (
          <View className="flex-row items-center">
            <Trophy size={14} color="#38a169" />
            <Text className="text-sm text-green-600 ml-1 font-semibold">
              Best: {test.bestScore}%
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default CoursesTestCard;
