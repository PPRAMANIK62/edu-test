import { X } from "lucide-react-native";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

interface SubjectPickerProps {
  label: string;
  subjects: string[];
  onSubjectsChange: (subjects: string[]) => void;
  error?: string;
}

const SubjectPicker = ({
  label,
  subjects,
  onSubjectsChange,
  error,
}: SubjectPickerProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleAddSubject = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !subjects.includes(trimmedValue)) {
      onSubjectsChange([...subjects, trimmedValue]);
      setInputValue("");
    }
  };

  const handleRemoveSubject = (subjectToRemove: string) => {
    onSubjectsChange(subjects.filter((s) => s !== subjectToRemove));
  };

  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-700 mb-2">{label}</Text>

      <View className="flex-row gap-2 mb-2">
        <TextInput
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Type a subject and press Add"
          onSubmitEditing={handleAddSubject}
          returnKeyType="done"
          className={`flex-1 border ${
            error ? "border-red-500" : "border-gray-300"
          } rounded-xl p-3 text-base text-gray-900 bg-white`}
          placeholderTextColor="#9ca3af"
        />
        <TouchableOpacity
          onPress={handleAddSubject}
          className="bg-violet-600 rounded-xl px-4 items-center justify-center"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold">Add</Text>
        </TouchableOpacity>
      </View>

      {subjects.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mt-2">
          {subjects.map((subject) => (
            <View
              key={subject}
              className="bg-violet-100 rounded-lg px-3 py-2 flex-row items-center"
            >
              <Text className="text-violet-700 font-medium mr-2">
                {subject}
              </Text>
              <TouchableOpacity
                onPress={() => handleRemoveSubject(subject)}
                activeOpacity={0.7}
              >
                <X size={16} color="#7c3aed" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
    </View>
  );
};

export default SubjectPicker;
