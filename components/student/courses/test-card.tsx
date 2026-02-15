import TestCardBase from "@/components/shared/test-card-base";
import { Test } from "@/types";
import { router } from "expo-router";
import { Lock, Play, Trophy } from "lucide-react-native";
import { Text, View } from "react-native";

type Props = {
  test: Test;
  isPurchased: boolean;
};

const CoursesTestCard = ({ test, isPurchased }: Props) => {
  if (!isPurchased) {
    return (
      <TestCardBase
        title={test.title}
        description={test.description}
        totalQuestions={test.total_questions}
        durationMinutes={test.duration_minutes}
        disabled
        className="bg-gray-100 rounded-xl p-4 border border-gray-200"
        headerClassName="flex-row items-start justify-between mb-3"
        titleClassName="text-base font-bold text-gray-900 mb-1"
        statsClassName="flex-row items-center gap-4 mb-3"
        iconSize={14}
        questionsLabel="Q"
        headerRight={
          <View className="bg-gray-400 rounded-full p-2 ml-3">
            <Lock size={16} color="#fff" />
          </View>
        }
        action={
          <View className="bg-gray-200 rounded-lg py-2 px-3">
            <Text className="text-gray-600 text-sm text-center font-medium">
              Purchase course to access
            </Text>
          </View>
        }
      />
    );
  }

  return (
    <TestCardBase
      title={test.title}
      description={test.description}
      totalQuestions={test.total_questions}
      durationMinutes={test.duration_minutes}
      onPress={() => router.push(`/(student)/test/${test.id}/intro`)}
      className="bg-gray-50 rounded-xl p-4"
      headerClassName="flex-row items-start justify-between mb-3"
      titleClassName="text-base font-bold text-gray-900 mb-1"
      iconSize={14}
      questionsLabel="Q"
      headerRight={
        <View className="bg-primary-600 rounded-full p-2 ml-3">
          <Play size={16} color="#fff" fill="#fff" />
        </View>
      }
      stats={
        test.best_score ? (
          <View className="flex-row items-center">
            <Trophy size={14} color="#38a169" />
            <Text className="text-sm text-green-600 ml-1 font-semibold">
              Best: {test.best_score}%
            </Text>
          </View>
        ) : undefined
      }
    />
  );
};

export default CoursesTestCard;
