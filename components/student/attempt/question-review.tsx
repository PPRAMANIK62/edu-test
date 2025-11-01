import { Question } from "@/types";
import { CheckCircle, Info, XCircle } from "lucide-react-native";
import { Text, View } from "react-native";

const QuestionReviewCard = ({
  question,
  index,
}: {
  question: Question & { selectedOptionId: string; isCorrect: boolean };
  index: number;
}) => (
  <View className="mb-6">
    <View className="flex-row items-start mb-3">
      <View
        className={`${
          question.isCorrect ? "bg-green-100" : "bg-red-100"
        } rounded-full p-2 mr-3`}
      >
        {question.isCorrect ? (
          <CheckCircle size={20} color="#38a169" />
        ) : (
          <XCircle size={20} color="#e53e3e" />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-sm text-primary-600 font-medium mb-1">
          Question {index + 1} • {question.subjectName}
        </Text>
        <Text className="text-base font-semibold text-gray-900 leading-6 mb-3">
          {question.text}
        </Text>

        <View className="gap-2">
          {question.options.map((option) => (
            <AnswerOption
              key={option.id}
              option={option}
              correctOptionId={question.correctOptionId}
              selectedOptionId={question.selectedOptionId}
            />
          ))}
        </View>

        <ExplanationCard explanation={question.explanation} />
      </View>
    </View>
  </View>
);

export default QuestionReviewCard;

const AnswerOption = ({
  option,
  correctOptionId,
  selectedOptionId,
}: {
  option: { id: string; label: string; text: string };
  correctOptionId: string;
  selectedOptionId: string;
}) => {
  const isCorrect = option.id === correctOptionId;
  const isSelected = option.id === selectedOptionId;
  const isWrong = isSelected && !isCorrect;

  const getBackgroundClass = () => {
    if (isCorrect) return "bg-green-50 border-green-500";
    if (isWrong) return "bg-red-50 border-red-500";
    return "bg-gray-50 border-gray-200";
  };

  const getTextClass = (isLabel: boolean) => {
    const baseClass = isLabel
      ? "font-bold text-sm mr-2"
      : "flex-1 text-sm leading-5";
    if (isCorrect)
      return `${baseClass} text-${isLabel ? "green-700" : "green-900"}`;
    if (isWrong) return `${baseClass} text-${isLabel ? "red-700" : "red-900"}`;
    return `${baseClass} text-gray-${isLabel ? "600" : "700"}`;
  };

  return (
    <View className={`${getBackgroundClass()} border rounded-lg p-3`}>
      <View className="flex-row items-start">
        <Text className={getTextClass(true)}>{option.label}</Text>
        <Text className={getTextClass(false)}>{option.text}</Text>
        {isCorrect && (
          <CheckCircle size={16} color="#38a169" className="ml-2" />
        )}
        {isWrong && <XCircle size={16} color="#e53e3e" className="ml-2" />}
      </View>
    </View>
  );
};

const ExplanationCard = ({ explanation }: { explanation: string }) => (
  <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
    <View className="flex-row items-start">
      <Info size={16} color="#1890ff" className="mt-0.5 mr-2" />
      <View className="flex-1">
        <Text className="text-primary-700 font-semibold text-sm mb-1">
          Explanation
        </Text>
        <Text className="text-primary-900 text-sm leading-5">
          {explanation}
        </Text>
      </View>
    </View>
  </View>
);
