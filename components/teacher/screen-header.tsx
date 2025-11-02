import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightComponent?: ReactNode;
}

const ScreenHeader = ({
  title,
  subtitle,
  onBack,
  rightComponent,
}: ScreenHeaderProps) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View className="bg-white border-b border-gray-100">
      <View className="flex-row items-center px-6 py-4">
        <TouchableOpacity
          onPress={handleBack}
          className="mr-3 p-2 -ml-2"
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900">{title}</Text>
          {subtitle && (
            <Text className="text-sm text-gray-600 mt-0.5" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {rightComponent && <View className="ml-2">{rightComponent}</View>}
      </View>
    </View>
  );
};

export default ScreenHeader;
