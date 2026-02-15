import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface CourseCardBaseProps {
  title: string;
  description: string;
  imageUrl: string;
  onPress?: () => void;
  imageHeight?: string;
  titleClassName?: string;
  titleLines?: number;
  descriptionClassName?: string;
  descriptionLines?: number;
  badge?: React.ReactNode;
  subtitle?: React.ReactNode;
  stats?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const CourseCardBase = ({
  title,
  description,
  imageUrl,
  onPress,
  imageHeight = "h-48",
  titleClassName = "text-xl font-bold text-gray-900 mb-2",
  titleLines,
  descriptionClassName = "text-sm text-gray-600 mb-4 leading-5",
  descriptionLines = 2,
  badge,
  subtitle,
  stats,
  footer,
  className = "",
}: CourseCardBaseProps) => {
  const titleElement = (
    <Text className={titleClassName} numberOfLines={titleLines}>
      {title}
    </Text>
  );

  return (
    <View
      className={`bg-white rounded-2xl overflow-hidden shadow-sm mb-4 ${className}`}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={onPress ? 0.9 : 1}
        disabled={!onPress}
      >
        <Image
          source={{ uri: imageUrl }}
          className={`w-full ${imageHeight}`}
          resizeMode="cover"
        />
        <View className="p-4">
          {badge || subtitle ? (
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1">
                {titleElement}
                {subtitle}
              </View>
              {badge}
            </View>
          ) : (
            titleElement
          )}
          <Text
            className={descriptionClassName}
            numberOfLines={descriptionLines}
          >
            {description}
          </Text>
          {stats}
          {footer}
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default CourseCardBase;
