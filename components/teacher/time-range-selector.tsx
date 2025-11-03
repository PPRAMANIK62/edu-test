import { TimeRangeFilter } from "@/types";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface TimeRangeSelectorProps {
  value: TimeRangeFilter;
  onChange: (value: TimeRangeFilter) => void;
  options?: { label: string; value: TimeRangeFilter }[];
}

const defaultOptions: { label: string; value: TimeRangeFilter }[] = [
  { label: "Last 30 Days", value: "30d" },
  { label: "Overall", value: "all" },
];

/**
 * Reusable time range selector component for analytics pages
 */
const TimeRangeSelector = ({
  value,
  onChange,
  options = defaultOptions,
}: TimeRangeSelectorProps) => {
  return (
    <View className="flex-row gap-2">
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          onPress={() => onChange(option.value)}
          className={`flex-1 px-4 py-3 rounded-xl ${
            value === option.value
              ? "bg-violet-600"
              : "bg-white border border-gray-200"
          }`}
          activeOpacity={0.7}
        >
          <Text
            className={`font-semibold text-sm text-center ${
              value === option.value ? "text-white" : "text-gray-700"
            }`}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default TimeRangeSelector;
