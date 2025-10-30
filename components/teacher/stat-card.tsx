import React from "react";
import { Text, View } from "react-native";

type Props = {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  bgColor: string;
};

const StatCard = ({ icon, value, label, bgColor }: Props) => {
  return (
    <View className="flex-1 min-w-[160px] bg-white rounded-2xl p-4 shadow-sm">
      <View
        className={`${bgColor} rounded-full w-10 h-10 items-center justify-center mb-3`}
      >
        {icon}
      </View>
      <Text className="text-2xl font-bold text-gray-900 mb-1">{value}</Text>
      <Text className="text-sm text-gray-600">{label}</Text>
    </View>
  );
};

export default StatCard;
