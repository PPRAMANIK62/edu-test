import React from "react";
import { Text, View } from "react-native";

interface FormSectionProps {
  title?: string;
  children: React.ReactNode;
}

const FormSection = ({ title, children }: FormSectionProps) => {
  return (
    <View className="mb-6">
      {title && (
        <Text className="text-lg font-bold text-gray-900 mb-4">{title}</Text>
      )}
      {children}
    </View>
  );
};

export default FormSection;
