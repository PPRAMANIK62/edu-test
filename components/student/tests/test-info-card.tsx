import { Test } from "@/types";
import { Clock, FileText, LucideIcon } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

const TestInfoCard = ({ test }: { test: Test }) => {
  const stats = [
    {
      icon: Clock,
      iconBgColor: "bg-primary-600",
      bgGradient: "bg-gradient-to-br from-blue-50 to-primary-50",
      borderColor: "border-primary-100",
      label: "Duration",
      value: test.duration_minutes,
      unit: "minutes",
    },
    {
      icon: FileText,
      iconBgColor: "bg-green-600",
      bgGradient: "bg-gradient-to-br from-purple-50 to-primary-50",
      borderColor: "border-purple-100",
      label: "Questions",
      value: test.total_questions,
      unit: "total",
    },
  ];

  return (
    <View className="flex-row items-stretch gap-3 mb-5">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </View>
  );
};

export default TestInfoCard;

type StatCardProps = {
  icon: LucideIcon;
  iconBgColor: string;
  bgGradient: string;
  borderColor: string;
  label: string;
  value: number;
  unit: string;
};

const StatCard = ({
  icon: Icon,
  iconBgColor,
  bgGradient,
  borderColor,
  label,
  value,
  unit,
}: StatCardProps) => (
  <View className={`flex-1 ${bgGradient} rounded-xl p-4 border ${borderColor}`}>
    <View className="flex-row items-center">
      <View
        className={`${iconBgColor} rounded-full w-10 h-10 items-center justify-center mr-3`}
      >
        <Icon size={20} color="#ffffff" />
      </View>
      <View className="flex-1">
        <Text className="text-xs text-gray-600 font-medium mb-1">{label}</Text>
        <View className="flex-row items-baseline">
          <Text className="text-2xl font-bold text-gray-900">{value}</Text>
          <Text className="text-xs text-gray-500 ml-1">{unit}</Text>
        </View>
      </View>
    </View>
  </View>
);
