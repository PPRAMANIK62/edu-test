import { formatTimeAgo } from "@/lib/utils";
import { RecentActivity } from "@/types";
import { Award, BookOpen } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

type Props = {
  activity: RecentActivity;
  index: number;
  length: number;
};

const RecentActivityCard = ({ activity, index, length }: Props) => {
  return (
    <View>
      <View className="p-4 flex-row items-center">
        <View
          className={`${
            activity.type === "test_completed"
              ? "bg-green-100"
              : activity.type === "course_started"
                ? "bg-blue-100"
                : "bg-amber-100"
          } rounded-full p-2.5 mr-3`}
        >
          {activity.type === "test_completed" ? (
            <Award size={18} color="#38a169" />
          ) : (
            <BookOpen size={18} color="#1890ff" />
          )}
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 font-semibold text-sm mb-0.5">
            {activity.title}
          </Text>
          <Text className="text-gray-500 text-xs">{activity.subtitle}</Text>
        </View>
        <Text className="text-gray-400 text-xs">
          {formatTimeAgo(activity.timestamp)}
        </Text>
      </View>
      {index < length - 1 && <View className="h-px bg-gray-100 ml-16" />}
    </View>
  );
};

export default RecentActivityCard;
