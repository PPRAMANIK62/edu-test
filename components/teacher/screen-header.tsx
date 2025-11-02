import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
}

const ScreenHeader = ({ title, onBack }: ScreenHeaderProps) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View className="flex-row items-center px-6 py-4 bg-white border-b border-gray-100">
      <TouchableOpacity
        onPress={handleBack}
        className="mr-3 p-2 -ml-2"
        activeOpacity={0.7}
      >
        <ArrowLeft size={24} color="#111827" />
      </TouchableOpacity>
      <Text className="text-xl font-bold text-gray-900 flex-1">{title}</Text>
    </View>
  );
};

export default ScreenHeader;
