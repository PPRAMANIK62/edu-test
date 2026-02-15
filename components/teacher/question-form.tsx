import FormInput from "@/components/teacher/form-input";
import FormSection from "@/components/teacher/form-section";
import MCQOptionsEditor from "@/components/teacher/mcq-options-editor";
import { MCQFormData, QuestionOption, Subject } from "@/types";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface QuestionFormProps {
  formData: MCQFormData;
  onFormDataChange: (data: MCQFormData) => void;
  subjects: Subject[];
  errors: Record<string, string>;
}

const QuestionForm = ({
  formData,
  onFormDataChange,
  subjects,
  errors,
}: QuestionFormProps) => {
  const handleTextChange = (text: string) => {
    onFormDataChange({ ...formData, text });
  };

  const handleExplanationChange = (explanation: string) => {
    onFormDataChange({ ...formData, explanation });
  };

  const handleSubjectChange = (subject_id: string) => {
    onFormDataChange({ ...formData, subject_id });
  };

  const handleOptionsChange = (options: QuestionOption[]) => {
    onFormDataChange({ ...formData, options });
  };

  const handleCorrectOptionChange = (correct_option_id: string) => {
    onFormDataChange({ ...formData, correct_option_id });
  };

  return (
    <View>
      <FormSection title="Question Details">
        <FormInput
          label="Question Text"
          value={formData.text}
          onChangeText={handleTextChange}
          placeholder="Enter the question..."
          error={errors.text}
          multiline
        />

        {/* Subject Picker */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Subject
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {subjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                onPress={() => handleSubjectChange(subject.id)}
                className={`px-4 py-2 rounded-full ${
                  formData.subject_id === subject.id
                    ? "bg-violet-600"
                    : "bg-gray-100"
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-sm font-medium ${
                    formData.subject_id === subject.id
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                >
                  {subject.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.subject_id && (
            <Text className="text-red-500 text-sm mt-1">
              {errors.subject_id}
            </Text>
          )}
        </View>
      </FormSection>

      <FormSection title="Answer Options">
        <MCQOptionsEditor
          options={formData.options}
          correctOptionId={formData.correct_option_id}
          onOptionsChange={handleOptionsChange}
          onCorrectOptionChange={handleCorrectOptionChange}
          error={errors.options || errors.correct_option_id}
        />
      </FormSection>

      <FormSection title="Explanation">
        <FormInput
          label="Answer Explanation"
          value={formData.explanation}
          onChangeText={handleExplanationChange}
          placeholder="Explain why the correct answer is correct..."
          error={errors.explanation}
          multiline
        />
      </FormSection>
    </View>
  );
};

export default QuestionForm;
