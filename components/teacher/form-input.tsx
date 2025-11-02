import React from "react";
import { Text, TextInput, View } from "react-native";

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric" | "email-address";
}

const FormInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline = false,
  keyboardType = "default",
}: FormInputProps) => {
  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-700 mb-2">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
        className={`border ${
          error ? "border-red-500" : "border-gray-300"
        } rounded-xl p-3 text-base text-gray-900 bg-white ${
          multiline ? "min-h-[100px]" : ""
        }`}
        placeholderTextColor="#9ca3af"
        textAlignVertical={multiline ? "top" : "center"}
      />
      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
    </View>
  );
};

export default FormInput;
