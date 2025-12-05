import { QuestionOption } from "@/types";
import { Check, Plus, Trash2 } from "lucide-react-native";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

interface MCQOptionsEditorProps {
  options: QuestionOption[];
  correctOptionId: string;
  onOptionsChange: (options: QuestionOption[]) => void;
  onCorrectOptionChange: (optionId: string) => void;
  error?: string;
}

const OPTION_LABELS: ("A" | "B" | "C" | "D" | "E" | "F")[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
];

const MCQOptionsEditor = ({
  options,
  correctOptionId,
  onOptionsChange,
  onCorrectOptionChange,
  error,
}: MCQOptionsEditorProps) => {
  const handleOptionTextChange = (index: number, text: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], text };
    onOptionsChange(updated);
  };

  const handleAddOption = () => {
    if (options.length >= 6) return;

    const newLabel = OPTION_LABELS[options.length];
    const newOption: QuestionOption = {
      id: `opt-${Date.now()}`,
      label: newLabel,
      text: "",
    };
    onOptionsChange([...options, newOption]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;

    const removedOption = options[index];
    const updated = options
      .filter((_, i) => i !== index)
      .map((opt, i) => ({
        ...opt,
        label: OPTION_LABELS[i],
      }));

    onOptionsChange(updated);

    // If removing the correct option, reset correctOptionId
    if (removedOption.id === correctOptionId) {
      onCorrectOptionChange("");
    }
  };

  const handleSelectCorrect = (optionId: string) => {
    onCorrectOptionChange(optionId);
  };

  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-700 mb-2">
        Answer Options
      </Text>

      {options.map((option, index) => (
        <View key={option.id} className="flex-row items-center mb-3">
          {/* Correct answer selector */}
          <TouchableOpacity
            onPress={() => handleSelectCorrect(option.id)}
            className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
              correctOptionId === option.id
                ? "bg-green-500"
                : "bg-gray-100 border border-gray-300"
            }`}
            activeOpacity={0.7}
          >
            {correctOptionId === option.id ? (
              <Check size={20} color="#fff" />
            ) : (
              <Text className="text-gray-600 font-semibold">
                {option.label}
              </Text>
            )}
          </TouchableOpacity>

          {/* Option text input */}
          <View className="flex-1">
            <TextInput
              value={option.text}
              onChangeText={(text) => handleOptionTextChange(index, text)}
              placeholder={`Option ${option.label}`}
              className="border border-gray-300 rounded-xl p-3 text-base text-gray-900 bg-white"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Remove option button */}
          {options.length > 2 && (
            <TouchableOpacity
              onPress={() => handleRemoveOption(index)}
              className="ml-2 p-2"
              activeOpacity={0.7}
            >
              <Trash2 size={20} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* Add option button */}
      {options.length < 6 && (
        <TouchableOpacity
          onPress={handleAddOption}
          className="flex-row items-center py-3 px-4 border border-dashed border-gray-300 rounded-xl"
          activeOpacity={0.7}
        >
          <Plus size={20} color="#6b7280" />
          <Text className="text-gray-600 ml-2">Add Option</Text>
        </TouchableOpacity>
      )}

      {/* Hint text */}
      <Text className="text-xs text-gray-500 mt-2">
        Tap the circle to mark the correct answer. Minimum 2, maximum 6 options.
      </Text>

      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
    </View>
  );
};

export default MCQOptionsEditor;
