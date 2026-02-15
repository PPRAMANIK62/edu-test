import { AlertTriangle } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

const ErrorState = ({
  message = "Something went wrong",
  onRetry,
}: ErrorStateProps) => {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50 px-6 py-20">
      <View className="mb-4 rounded-full bg-red-50 p-4">
        <AlertTriangle size={32} color="#ef4444" />
      </View>
      <Text className="mb-2 text-center text-xl font-bold text-gray-900">
        {message}
      </Text>
      <Text className="mb-6 text-center text-sm text-gray-500">
        Please check your connection and try again.
      </Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          activeOpacity={0.8}
          className="rounded-xl bg-primary-600 px-8 py-3"
        >
          <Text className="text-base font-semibold text-white">Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ErrorState;
