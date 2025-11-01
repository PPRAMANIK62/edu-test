import { Question } from "@/types";
import { Text, View } from "react-native";

type ReviewDataProps = {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  questions: Question[];
};

const ResultsOverview = ({ reviewData }: { reviewData: ReviewDataProps }) => {
  const stats = [
    { value: reviewData.score, label: "Correct" },
    { value: reviewData.total - reviewData.score, label: "Incorrect" },
    { value: reviewData.total, label: "Total" },
  ];

  return (
    <View
      className={`${reviewData.passed ? "bg-green-500" : "bg-amber-500"} px-6 py-8`}
    >
      <Text className="text-white text-4xl font-bold text-center mb-2">
        {reviewData.percentage}%
      </Text>
      <Text className="text-white text-lg font-semibold text-center mb-4">
        {reviewData.passed ? "Great Job! You Passed!" : "Keep Practicing"}
      </Text>
      <View className="flex-row justify-center gap-6 mt-4">
        {stats.map((stat, index) => (
          <StatItem key={index} value={stat.value} label={stat.label} />
        ))}
      </View>
    </View>
  );
};

export default ResultsOverview;

const StatItem = ({ value, label }: { value: number; label: string }) => (
  <View className="items-center">
    <Text className="text-white text-2xl font-bold">{value}</Text>
    <Text className="text-white/90 text-sm">{label}</Text>
  </View>
);
