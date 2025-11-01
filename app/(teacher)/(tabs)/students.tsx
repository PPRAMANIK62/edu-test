import StatCard from "@/components/teacher/stat-card";
import StudentCard from "@/components/teacher/student-card";
import { MOCK_STATS, MOCK_STUDENTS } from "@/lib/mockdata";
import { useQuery } from "@tanstack/react-query";
import { Award, Filter, Search, TrendingUp, Users } from "lucide-react-native";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TeacherStudents = () => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: students } = useQuery({
    queryKey: ["teacher-students"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_STUDENTS;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["student-stats-overview"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_STATS;
    },
  });

  const filteredStudents = students?.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-4" style={{ paddingTop: insets.top + 24 }}>
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Students & Ratings
          </Text>
          <Text className="text-base text-gray-600">
            Track student progress and engagement
          </Text>
        </View>

        <View className="px-6 mb-6">
          <View className="flex-row flex-wrap gap-3 mb-4">
            <StatCard
              icon={<Users size={20} color="#7c3aed" />}
              value={stats?.totalActive.toLocaleString() ?? "0"}
              label="Total Active"
              iconBgColor="bg-violet-50"
            />
            <StatCard
              icon={<TrendingUp size={20} color="#10b981" />}
              value={`+${stats?.newThisMonth ?? 0}`}
              label="This Month"
              iconBgColor="bg-emerald-50"
            />
            <StatCard
              icon={<Award size={20} color="#0ea5e9" />}
              value={`${stats?.avgCompletion ?? 0}%`}
              label="Avg Completion"
              iconBgColor="bg-sky-50"
            />
          </View>

          <View className="bg-white rounded-xl p-4 flex-row items-center shadow-sm mb-4">
            <Search size={20} color="#9ca3af" />
            <TextInput
              className="flex-1 ml-3 text-gray-900 text-base"
              placeholder="Search students..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity activeOpacity={0.7} className="ml-2">
              <Filter size={20} color="#7c3aed" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-6 pb-8">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            All Students
          </Text>
          <View className="gap-3">
            {filteredStudents?.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))}
          </View>

          {filteredStudents?.length === 0 && (
            <View className="items-center justify-center py-12">
              <View className="bg-gray-100 rounded-full p-6 mb-4">
                <Users size={40} color="#9ca3af" />
              </View>
              <Text className="text-gray-900 font-bold text-lg mb-2">
                No students found
              </Text>
              <Text className="text-gray-600 text-center px-8">
                Try adjusting your search query
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default TeacherStudents;
