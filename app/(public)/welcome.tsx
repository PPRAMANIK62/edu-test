import { useRouter } from "expo-router";
import {
  BookOpen,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react-native";
import React from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ minHeight: height - 100 }}
      >
        <View className="flex-1 px-6 pt-8">
          <View className="mb-12">
            <View className="flex-row items-center mb-4">
              <GraduationCap size={50} color="#1890ff" strokeWidth={2.5} />
              <Text className="text-4xl font-bold text-gray-900 ml-3">
                EduTest
              </Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900 mb-4">
              Master Your {"\n"}Exam Prep
            </Text>
            <Text className="text-lg text-gray-600">
              Practice with thousands of questions, take timed tests, and track
              your progress.
            </Text>
          </View>

          <View className="mb-12">
            <FeatureCard
              icon={<BookOpen size={24} color="#1890ff" />}
              title="Comprehensive Courses"
              description="Access expertly crafted test bundles for SAT, IELTS, GRE, and more."
            />
            <FeatureCard
              icon={<TrendingUp size={24} color="#1890ff" />}
              title="Track Progress"
              description="Monitor your improvement with detailed analytics and insights."
            />
            <FeatureCard
              icon={<Users size={24} color="#1890ff" />}
              title="Expert Teachers"
              description="Learn from experienced educators who know what it takes to succeed."
            />
          </View>

          <View className="mt-auto pb-6">
            <TouchableOpacity
              onPress={() => router.push("/(public)/sign-up")}
              className="bg-primary-600 rounded-2xl py-4 mb-4 overflow-hidden"
              activeOpacity={0.8}
            >
              <Text className="text-white text-lg font-semibold text-center">
                Get Started
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(public)/sign-in")}
              className="bg-gray-100 rounded-2xl py-4"
              activeOpacity={0.7}
            >
              <Text className="text-gray-900 text-lg font-semibold text-center">
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <View className="flex-row items-start mb-6">
      <View className="bg-primary-50 rounded-full p-3 mr-4">{icon}</View>
      <View className="flex-1">
        <Text className="text-lg font-semibold text-gray-900 mb-1">
          {title}
        </Text>
        <Text className="text-base text-gray-600 leading-relaxed">
          {description}
        </Text>
      </View>
    </View>
  );
}
