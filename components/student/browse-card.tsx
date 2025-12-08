import { PaymentButton } from "@/components/student/payment-button";
import { Course } from "@/types";
import { useRouter } from "expo-router";
import { Clock, FileText, Star, Users } from "lucide-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

const BrowseCard = ({ course }: { course: Course }) => {
  const router = useRouter();

  return (
    <View className="bg-white rounded-2xl overflow-hidden shadow-sm mb-4">
      <TouchableOpacity
        onPress={() => {
          router.push(`/(student)/courses/${course.id}`);
        }}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: course.imageUrl }}
          className="w-full h-48"
          resizeMode="cover"
        />
        <View className="p-4">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900 mb-1">
                {course.title}
              </Text>
              <Text className="text-sm text-primary-600 font-medium">
                {course.teacherName}
              </Text>
            </View>
            {!course.isPurchased && (
              <View className="bg-primary-600 rounded-lg px-3 py-1.5">
                <Text className="text-white font-bold text-sm">
                  ₹{course.price}
                </Text>
              </View>
            )}
          </View>

          <Text
            className="text-sm text-gray-600 mb-4 leading-5"
            numberOfLines={2}
          >
            {course.description}
          </Text>

          <View className="flex-row items-center gap-4 mb-4">
            <View className="flex-row items-center">
              <Star size={16} color="#f59e0b" fill="#f59e0b" />
              <Text className="text-sm text-gray-600 ml-1">
                {course.rating?.toFixed(1)}
              </Text>
            </View>
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

          <PaymentButton
            courseId={course.id}
            price={course.price}
            showPrice={false}
            onSuccess={() => {
              router.push(`/(student)/courses/${course.id}`);
            }}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default BrowseCard;
