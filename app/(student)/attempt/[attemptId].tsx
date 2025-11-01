import { MOCK_QUESTIONS } from "@/lib/mockdata";
import { AttemptAnswer } from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  AppStateStatus,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AttemptScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const router = useRouter();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AttemptAnswer>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isBackgrounded, setIsBackgrounded] = useState(false);
  const endTimeRef = useRef<Date | null>(null);

  const { data: attemptData } = useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const serverEndTime = new Date(Date.now() + 80 * 60 * 1000);
      endTimeRef.current = serverEndTime;

      return {
        attemptId,
        testId: "test-1",
        endTime: serverEndTime.toISOString(),
        startTime: new Date().toISOString(),
      };
    },
  });

  const { data: questions } = useQuery({
    queryKey: ["attempt-questions", attemptId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_QUESTIONS;
    },
    enabled: !!attemptData,
  });

  useEffect(() => {
    if (!attemptData) return;

    const calculateTimeRemaining = () => {
      if (!endTimeRef.current) return 0;
      const now = new Date();
      const remaining = Math.max(
        0,
        Math.floor((endTimeRef.current.getTime() - now.getTime()) / 1000)
      );
      return remaining;
    };

    setTimeRemaining(calculateTimeRemaining());

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        handleAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [attemptData]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "background" || nextAppState === "inactive") {
          setIsBackgrounded(true);
        } else if (nextAppState === "active") {
          setIsBackgrounded(false);
          if (endTimeRef.current) {
            const now = new Date();
            const remaining = Math.max(
              0,
              Math.floor((endTimeRef.current.getTime() - now.getTime()) / 1000)
            );
            setTimeRemaining(remaining);

            if (remaining <= 0) {
              handleAutoSubmit();
            }
          }
        }
      }
    );

    return () => {
      subscription.remove();
    };
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const answeredCount = Object.values(answers).filter(
        (a) => a.selectedOptionId
      ).length;
      const correctCount = Object.values(answers).filter((a) => {
        const question = questions?.find((q) => q.id === a.questionId);
        return question && a.selectedOptionId === question.correctOptionId;
      }).length;

      return {
        score: correctCount,
        total: questions?.length || 0,
        percentage: Math.round((correctCount / (questions?.length || 1)) * 100),
      };
    },
    onSuccess: () => {
      router.replace(`/(student)/attempt/${attemptId}/review`);
    },
  });

  const handleAutoSubmit = () => {
    if (!submitMutation.isPending) {
      Alert.alert("Time Up!", "Your test has been submitted automatically.", [
        { text: "OK", onPress: () => submitMutation.mutate() },
      ]);
    }
  };

  const handleSubmit = () => {
    const unanswered =
      (questions?.length || 0) -
      Object.values(answers).filter((a) => a.selectedOptionId).length;

    if (unanswered > 0) {
      Alert.alert(
        "Unanswered Questions",
        `You have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}. Do you want to submit anyway?`,
        [
          { text: "Review", style: "cancel" },
          {
            text: "Submit",
            style: "destructive",
            onPress: () => submitMutation.mutate(),
          },
        ]
      );
    } else {
      Alert.alert("Submit Test", "Are you sure you want to submit your test?", [
        { text: "Cancel", style: "cancel" },
        { text: "Submit", onPress: () => submitMutation.mutate() },
      ]);
    }
  };

  const handleSelectAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        questionId,
        selectedOptionId: optionId,
        isMarkedForReview: prev[questionId]?.isMarkedForReview || false,
      },
    }));
  };

  const handleToggleFlag = (questionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {
          questionId,
          selectedOptionId: undefined,
          isMarkedForReview: false,
        }),
        isMarkedForReview: !prev[questionId]?.isMarkedForReview,
      },
    }));
  };

  if (!questions || questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.id];
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="bg-primary-600 px-6 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Clock size={20} color="#fff" />
          <Text className="text-white font-bold text-lg ml-2">
            {minutes.toString().padStart(2, "0")}:
            {seconds.toString().padStart(2, "0")}
          </Text>
        </View>
        <Text className="text-white font-semibold">
          Question {currentQuestionIndex + 1}/{questions.length}
        </Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isBackgrounded || submitMutation.isPending}
          className="bg-white/20 rounded-lg px-4 py-2"
        >
          <Text className="text-white font-semibold text-sm">Submit</Text>
        </TouchableOpacity>
      </View>

      {isBackgrounded && (
        <View className="bg-amber-500 px-6 py-3">
          <View className="flex-row items-center">
            <AlertCircle size={18} color="#fff" />
            <Text className="text-white font-semibold ml-2">
              Test paused - Return to the app to continue
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        className="flex-1 px-6 py-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm text-primary-600 font-semibold">
              {currentQuestion.subjectName}
            </Text>
            <TouchableOpacity
              onPress={() => handleToggleFlag(currentQuestion.id)}
              activeOpacity={0.7}
            >
              <Flag
                size={20}
                color={currentAnswer?.isMarkedForReview ? "#f59e0b" : "#9ca3af"}
                fill={currentAnswer?.isMarkedForReview ? "#f59e0b" : "none"}
              />
            </TouchableOpacity>
          </View>
          <Text className="text-xl font-bold text-gray-900 leading-7 mb-6">
            {currentQuestion.text}
          </Text>
        </View>

        <View className="gap-3 mb-6">
          {currentQuestion.options.map((option) => {
            const isSelected = currentAnswer?.selectedOptionId === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() =>
                  handleSelectAnswer(currentQuestion.id, option.id)
                }
                disabled={isBackgrounded}
                activeOpacity={0.7}
                className={`${
                  isSelected
                    ? "bg-primary-50 border-primary-600 border-2"
                    : "bg-gray-50 border-gray-200 border"
                } rounded-xl p-4`}
              >
                <View className="flex-row items-start">
                  <View
                    className={`${
                      isSelected
                        ? "bg-primary-600"
                        : "bg-white border-2 border-gray-300"
                    } rounded-full w-6 h-6 items-center justify-center mr-3 mt-0.5`}
                  >
                    <Text
                      className={`${isSelected ? "text-white" : "text-gray-600"} font-bold text-sm`}
                    >
                      {option.label}
                    </Text>
                  </View>
                  <Text
                    className={`flex-1 ${isSelected ? "text-gray-900 font-medium" : "text-gray-700"} text-base leading-6`}
                  >
                    {option.text}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="h-20" />
      </ScrollView>

      <View className="px-6 py-4 border-t border-gray-100 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() =>
            setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
          }
          disabled={currentQuestionIndex === 0 || isBackgrounded}
          className={`${
            currentQuestionIndex === 0 ? "opacity-30" : ""
          } flex-row items-center bg-gray-100 rounded-xl px-5 py-3`}
        >
          <ChevronLeft size={20} color="#374151" />
          <Text className="text-gray-900 font-semibold ml-1">Previous</Text>
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-1 mx-4"
        >
          <View className="flex-row gap-2">
            {questions.map((q, idx) => {
              const ans = answers[q.id];
              const isAnswered = !!ans?.selectedOptionId;
              const isFlagged = !!ans?.isMarkedForReview;
              const isCurrent = idx === currentQuestionIndex;

              return (
                <TouchableOpacity
                  key={q.id}
                  onPress={() => setCurrentQuestionIndex(idx)}
                  disabled={isBackgrounded}
                  className={`${
                    isCurrent
                      ? "bg-primary-600"
                      : isAnswered
                        ? "bg-green-500"
                        : isFlagged
                          ? "bg-amber-500"
                          : "bg-gray-200"
                  } w-10 h-10 rounded-lg items-center justify-center`}
                >
                  <Text
                    className={`${isCurrent || isAnswered || isFlagged ? "text-white" : "text-gray-700"} font-bold text-sm`}
                  >
                    {idx + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <TouchableOpacity
          onPress={() =>
            setCurrentQuestionIndex((prev) =>
              Math.min(questions.length - 1, prev + 1)
            )
          }
          disabled={
            currentQuestionIndex === questions.length - 1 || isBackgrounded
          }
          className={`${
            currentQuestionIndex === questions.length - 1 ? "opacity-30" : ""
          } flex-row items-center bg-primary-600 rounded-xl px-5 py-3`}
        >
          <Text className="text-white font-semibold mr-1">Next</Text>
          <ChevronRight size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
