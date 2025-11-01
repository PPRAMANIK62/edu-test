import React from "react";
import { Text, View } from "react-native";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor?: string;
  iconBgColor: string;
}

const StatCard = ({
  icon,
  label,
  value,
  bgColor = "bg-white",
  iconBgColor,
}: StatCardProps) => {
  return (
    <View
      className={`flex-1 min-w-[160px] ${bgColor} rounded-2xl p-4 shadow-sm`}
    >
      <View
        className={`${iconBgColor} rounded-full w-10 h-10 items-center justify-center mb-3`}
      >
        <Text>{icon}</Text>
      </View>
      <Text className="text-2xl font-bold text-gray-900 mb-1">{value}</Text>
      <Text className="text-sm text-gray-600">{label}</Text>
    </View>
  );
};

export default StatCard;
