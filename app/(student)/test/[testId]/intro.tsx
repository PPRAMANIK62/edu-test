import TestInfoCard from "@/components/student/tests/test-info-card";
import { MOCK_TESTS } from "@/lib/mockdata";
import { Subject } from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { AlertCircle, Play } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TestIntro = () => {
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const router = useRouter();

  const { data: test } = useQuery({
    queryKey: ["test", testId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_TESTS.find((t) => t.id === testId);
    },
  });

  const startMutation = useMutation({
    mutationFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const serverTime = new Date();
      const endTime = new Date(
        serverTime.getTime() + (test?.durationMinutes || 60) * 60 * 1000
      );

      return {
        attemptId: `attempt-${Date.now()}`,
        startTime: serverTime.toISOString(),
        endTime: endTime.toISOString(),
      };
    },
    onSuccess: (data) => {
      router.replace(`/(student)/attempt/${data.attemptId}`);
    },
  });

  if (!test) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <Stack.Screen />
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="py-6">
          <Text className="text-3xl font-bold text-gray-900 mb-3">
            {test.title}
          </Text>
          <Text className="text-base text-gray-600 mb-6">
            {test.description}
          </Text>

          <TestInfoCard test={test} />

          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Test Breakdown
            </Text>
            <View className="bg-gray-50 rounded-xl p-4">
              {test.subjects.map((subject, index) => (
                <SubjectInfo
                  key={subject.id}
                  subject={subject}
                  index={index}
                  length={test.subjects.length}
                />
              ))}
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Instructions
            </Text>
            <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <View className="flex-row items-start">
                <AlertCircle size={20} color="#f59e0b" />
                <View className="flex-1 ml-3">
                  <Text className="text-amber-900 font-semibold mb-1">
                    Important
                  </Text>
                  <Text className="text-amber-800 text-sm leading-5">
                    Once you start, the timer cannot be paused. Make sure you
                    have a stable connection and enough time to complete the
                    test.
                  </Text>
                </View>
              </View>
            </View>

            <View className="gap-3">
              <InstructionItem
                number={1}
                text="Read each question carefully before selecting your answer"
              />
              <InstructionItem
                number={2}
                text="You can mark questions for review and return to them later"
              />
              <InstructionItem
                number={3}
                text="The test will auto-submit when time expires"
              />
              <InstructionItem
                number={4}
                text={`You need ${test.passingScore}% to pass this test`}
              />
            </View>
          </View>

          {test.attemptCount > 0 && test.bestScore && (
            <View className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <Text className="text-green-900 font-semibold mb-1">
                Previous Best Score
              </Text>
              <Text className="text-green-700 text-sm">
                You scored {test.bestScore}% in your previous attempt. Good luck
                improving your score!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View className="p-6 border-t border-gray-100">
        <TouchableOpacity
          onPress={() => startMutation.mutate()}
          disabled={startMutation.isPending}
          className="bg-primary-600 rounded-2xl py-4 flex-row items-center justify-center"
          activeOpacity={0.8}
        >
          {startMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Play size={20} color="#fff" fill="#fff" />
              <Text className="text-white text-lg font-bold ml-2">
                Start Test
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default TestIntro;

interface InstructionItemProps {
  number: number;
  text: string;
}

const InstructionItem = ({ number, text }: InstructionItemProps) => {
  return (
    <View className="flex-row items-start">
      <View className="bg-gray-100 rounded-full w-6 h-6 items-center justify-center mr-3 mt-0.5">
        <Text className="text-gray-500 text-xs font-bold">{number}</Text>
      </View>
      <Text className="flex-1 text-gray-700 text-base leading-6">{text}</Text>
    </View>
  );
};

interface SubjectInfoProps {
  subject: Subject;
  index: number;
  length: number;
}

const SubjectInfo = ({ subject, index, length }: SubjectInfoProps) => {
  return (
    <View key={subject.id}>
      <View className="flex-row items-center justify-between py-3">
        <Text className="text-gray-900 font-medium">{subject.name}</Text>
        <Text className="text-gray-600 font-semibold">
          {subject.questionCount} questions
        </Text>
      </View>
      {index < length - 1 && <View className="h-px bg-gray-200" />}
    </View>
  );
};
