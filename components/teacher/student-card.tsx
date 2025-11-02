import { formatTimeAgo } from "@/lib/utils";
import { Student } from "@/types";
import { router } from "expo-router";
import { Star } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const StudentCard = ({ student }: { student: Student }) => {
  return (
    <TouchableOpacity
      key={student.id}
      activeOpacity={0.7}
      className="bg-white rounded-2xl p-4 shadow-sm"
      onPress={() => {
        router.push(`/(teacher)/students/${student.id}`);
      }}
    >
      <View className="flex-row items-start mb-3">
        <View className="bg-gradient-to-br from-violet-100 to-sky-100 rounded-full w-12 h-12 items-center justify-center mr-3">
          <Text className="text-violet-700 font-bold text-lg">
            {student.name.charAt(0)}
          </Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-gray-900 font-bold text-base">
              {student.name}
            </Text>
            <View
              className={`px-2 py-0.5 rounded-full ${
                student.status === "active" ? "bg-green-100" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  student.status === "active"
                    ? "text-green-700"
                    : "text-gray-600"
                }`}
              >
                {student.status}
              </Text>
            </View>
          </View>
          <Text className="text-gray-500 text-sm mb-1">{student.email}</Text>
          <Text className="text-gray-400 text-xs">
            Last active {formatTimeAgo(student.lastActive)}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
        <StudentStat value={student.enrolledCourses} label="Courses" />
        <Divider />
        <StudentStat value={student.completedTests} label="Tests Done" />
        <Divider />
        <StudentStat
          value={`${student.averageScore}%`}
          label="Avg Score"
          icon={<Star size={14} color="#f59e0b" fill="#f59e0b" />}
        />
        <Divider />
        <StudentStat value={`$${student.totalSpent}`} label="Spent" />
      </View>
    </TouchableOpacity>
  );
};

export default StudentCard;

const Divider = () => <View className="w-px h-8 bg-gray-200" />;

type StudentStatProps = {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
};

const StudentStat = ({ value, label, icon }: StudentStatProps) => {
  return (
    <View className="items-center">
      {icon ? (
        <View className="flex-row items-center gap-1">
          {icon}
          <Text className="text-gray-900 font-bold text-base">{value}</Text>
        </View>
      ) : (
        <Text className="text-gray-900 font-bold text-base">{value}</Text>
      )}
      <Text className="text-gray-500 text-xs">{label}</Text>
    </View>
  );
};
