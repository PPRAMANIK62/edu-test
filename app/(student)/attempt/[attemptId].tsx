import { useAppwrite } from "@/hooks/use-appwrite";
import {
  getAnswersFromAttempt,
  useAttempt,
  useCompleteAttempt,
  useSubmitAnswer,
} from "@/hooks/use-attempts";
import { useQuestionsByTest } from "@/hooks/use-questions";
import { useTest } from "@/hooks/use-tests";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Local answer state for UI (before syncing to DB)
interface LocalAnswer {
  questionIndex: number;
  selectedIndex: number | null;
  isMarkedForReview: boolean;
}

export default function AttemptScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const router = useRouter();
  const { userProfile } = useAppwrite();
  const studentId = userProfile?.$id;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<Record<number, LocalAnswer>>(
    {},
  );
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isBackgrounded, setIsBackgrounded] = useState(false);
  const endTimeRef = useRef<Date | null>(null);

  // Fetch attempt data
  const { data: attemptData, isLoading: attemptLoading } =
    useAttempt(attemptId);

  const { data: testData } = useTest(attemptData?.testId);

  // Fetch questions for the test
  const { data: questionsData, isLoading: questionsLoading } =
    useQuestionsByTest(attemptData?.testId);

  // Mutations
  const submitAnswerMutation = useSubmitAnswer();
  const completeAttemptMutation = useCompleteAttempt();

  // Map database questions to UI format
  const questions = useMemo(() => {
    if (!questionsData?.documents) return [];

    return questionsData.documents.map((q, index) => ({
      id: q.$id,
      index,
      subjectName: q.subjectName,
      text: q.text,
      options: q.options.map((text, optIndex) => ({
        id: `opt-${optIndex}`,
        label: String.fromCharCode(65 + optIndex), // A, B, C, D
        text,
      })),
      correctIndex: q.correctIndex,
    }));
  }, [questionsData]);

  // Initialize local answers from database answers when attempt loads
  useEffect(() => {
    if (!attemptData) return;

    const dbAnswers = getAnswersFromAttempt(attemptData);
    const initialAnswers: Record<number, LocalAnswer> = {};

    for (const answer of dbAnswers) {
      const [questionIndex, selectedIndex, isMarkedForReview] = answer;
      initialAnswers[questionIndex] = {
        questionIndex,
        selectedIndex,
        isMarkedForReview,
      };
    }

    setLocalAnswers(initialAnswers);
  }, [attemptData]);

  const handleSubmitTest = useCallback(() => {
    if (!attemptId || !attemptData || !studentId) return;

    completeAttemptMutation.mutate(
      {
        attemptId,
        studentId,
        testId: attemptData.testId,
      },
      {
        onSuccess: () => {
          router.replace(`/(student)/attempt/${attemptId}/review`);
        },
        onError: () => {
          Alert.alert("Error", "Failed to submit test. Please try again.");
        },
      },
    );
  }, [attemptId, attemptData, studentId, completeAttemptMutation, router]);

  const handleAutoSubmit = useCallback(() => {
    if (!completeAttemptMutation.isPending && attemptData && studentId) {
      Alert.alert("Time Up!", "Your test has been submitted automatically.", [
        { text: "OK", onPress: () => handleSubmitTest() },
      ]);
    }
  }, [
    completeAttemptMutation.isPending,
    attemptData,
    studentId,
    handleSubmitTest,
  ]);

  useEffect(() => {
    if (!attemptData) return;

    const startTime = new Date(attemptData.startedAt);
    const durationMinutes = testData?.durationMinutes ?? 60;
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    endTimeRef.current = endTime;

    const calculateTimeRemaining = () => {
      if (!endTimeRef.current) return 0;
      const now = new Date();
      const remaining = Math.max(
        0,
        Math.floor((endTimeRef.current.getTime() - now.getTime()) / 1000),
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
  }, [attemptData, testData, handleAutoSubmit]);

  // App state handling for background/foreground
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
              Math.floor((endTimeRef.current.getTime() - now.getTime()) / 1000),
            );
            setTimeRemaining(remaining);

            if (remaining <= 0) {
              handleAutoSubmit();
            }
          }
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [handleAutoSubmit]);

  const handleSubmit = () => {
    const unanswered =
      questions.length -
      Object.values(localAnswers).filter((a) => a.selectedIndex !== null)
        .length;

    if (unanswered > 0) {
      Alert.alert(
        "Unanswered Questions",
        `You have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}. Do you want to submit anyway?`,
        [
          { text: "Review", style: "cancel" },
          {
            text: "Submit",
            style: "destructive",
            onPress: handleSubmitTest,
          },
        ],
      );
    } else {
      Alert.alert("Submit Test", "Are you sure you want to submit your test?", [
        { text: "Cancel", style: "cancel" },
        { text: "Submit", onPress: handleSubmitTest },
      ]);
    }
  };

  const handleSelectAnswer = (questionIndex: number, optionIndex: number) => {
    if (!attemptId) return;

    const currentAnswer = localAnswers[questionIndex];
    const isMarkedForReview = currentAnswer?.isMarkedForReview || false;

    // Update local state immediately for responsive UI
    setLocalAnswers((prev) => ({
      ...prev,
      [questionIndex]: {
        questionIndex,
        selectedIndex: optionIndex,
        isMarkedForReview,
      },
    }));

    // Sync to database
    submitAnswerMutation.mutate({
      attemptId,
      questionIndex,
      selectedIndex: optionIndex,
      isMarkedForReview,
    });
  };

  const handleToggleFlag = (questionIndex: number) => {
    if (!attemptId) return;

    const currentAnswer = localAnswers[questionIndex];
    const newIsMarkedForReview = !currentAnswer?.isMarkedForReview;
    const selectedIndex = currentAnswer?.selectedIndex ?? -1;

    // Update local state immediately
    setLocalAnswers((prev) => ({
      ...prev,
      [questionIndex]: {
        questionIndex,
        selectedIndex: currentAnswer?.selectedIndex ?? null,
        isMarkedForReview: newIsMarkedForReview,
      },
    }));

    // Only sync if there's a selected answer
    if (selectedIndex >= 0) {
      submitAnswerMutation.mutate({
        attemptId,
        questionIndex,
        selectedIndex,
        isMarkedForReview: newIsMarkedForReview,
      });
    }
  };

  if (
    attemptLoading ||
    questionsLoading ||
    !attemptData ||
    questions.length === 0
  ) {
    return (
      <SafeAreaView
        className="flex-1 bg-white items-center justify-center"
        edges={["top", "bottom"]}
      >
        <ActivityIndicator size="large" color="#1890ff" />
        <Text className="text-gray-500 mt-4">Loading test...</Text>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = localAnswers[currentQuestionIndex];
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
          disabled={isBackgrounded || completeAttemptMutation.isPending}
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
              onPress={() => handleToggleFlag(currentQuestionIndex)}
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
          {currentQuestion.options.map((option, optionIndex) => {
            const isSelected = currentAnswer?.selectedIndex === optionIndex;
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() =>
                  handleSelectAnswer(currentQuestionIndex, optionIndex)
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
              const ans = localAnswers[idx];
              const isAnswered =
                ans?.selectedIndex !== null && ans?.selectedIndex !== undefined;
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
              Math.min(questions.length - 1, prev + 1),
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
