import { Clock, FileText } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface TestCardBaseProps {
  title: string;
  description: string;
  totalQuestions: number;
  durationMinutes: number;
  onPress?: () => void;
  /** Slot: content above the title (e.g., course name label) */
  headerExtra?: React.ReactNode;
  /** Slot: right side of the header (e.g., icon badge) */
  headerRight?: React.ReactNode;
  /** Slot: additional stats after questions + duration */
  stats?: React.ReactNode;
  /** Slot: action area at the bottom of the card */
  action?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  statsClassName?: string;
  iconSize?: number;
  questionsLabel?: string;
}

const TestCardBase = ({
  title,
  description,
  totalQuestions,
  durationMinutes,
  onPress,
  headerExtra,
  headerRight,
  stats,
  action,
  disabled = false,
  className = "bg-white rounded-2xl p-4 shadow-sm mb-4",
  headerClassName = "flex-row items-start justify-between mb-2",
  titleClassName = "text-lg font-bold text-gray-900 mb-1",
  statsClassName = "flex-row items-center gap-4",
  iconSize = 16,
  questionsLabel = "questions",
}: TestCardBaseProps) => {
  const content = (
    <>
      <View className={headerClassName}>
        <View className="flex-1">
          {headerExtra}
          <Text className={titleClassName}>{title}</Text>
          <Text className="text-sm text-gray-600 leading-5" numberOfLines={2}>
            {description}
          </Text>
        </View>
        {headerRight}
      </View>

      <View className={statsClassName}>
        <View className="flex-row items-center">
          <FileText size={iconSize} color="#6b7280" />
          <Text className="text-sm text-gray-600 ml-1">
            {totalQuestions} {questionsLabel}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Clock size={iconSize} color="#6b7280" />
          <Text className="text-sm text-gray-600 ml-1">
            {durationMinutes} min
          </Text>
        </View>
        {stats}
      </View>

      {action}
    </>
  );

  if (disabled) {
    return <View className={className}>{content}</View>;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className={className}
    >
      {content}
    </TouchableOpacity>
  );
};

export default TestCardBase;
