import CourseCardBase from "@/components/shared/course-card-base";
import { PaymentButton } from "@/components/student/payment-button";
import { Course } from "@/types";
import { useRouter } from "expo-router";
import { Clock, FileText, Users } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

const BrowseCard = ({ course }: { course: Course }) => {
  const router = useRouter();

  return (
    <CourseCardBase
      title={course.title}
      description={course.description}
      imageUrl={course.imageUrl}
      onPress={() => router.push(`/(student)/courses/${course.id}`)}
      titleClassName="text-xl font-bold text-gray-900 mb-1"
      subtitle={
        <Text className="text-sm text-primary-600 font-medium">
          {course.teacherName}
        </Text>
      }
      badge={
        !course.isPurchased ? (
          <View className="bg-primary-600 rounded-lg px-3 py-1.5">
            <Text className="text-white font-bold text-sm">
              ₹{course.price}
            </Text>
          </View>
        ) : undefined
      }
      stats={
        <View className="flex-row items-center gap-4 mb-4">
          <View className="flex-row items-center">
            <Users size={16} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-1">
              {course.enrollmentCount}
            </Text>
          </View>
          <View className="flex-row items-center">
            <FileText size={16} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-1">
              {course.totalTests} tests
            </Text>
          </View>
          <View className="flex-row items-center">
            <Clock size={16} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-1">
              {course.estimatedHours}h
            </Text>
          </View>
        </View>
      }
      footer={
        <PaymentButton
          courseId={course.id}
          price={course.price}
          showPrice={false}
          onSuccess={() => {
            router.push(`/(student)/courses/${course.id}`);
          }}
        />
      }
    />
  );
};

export default BrowseCard;
