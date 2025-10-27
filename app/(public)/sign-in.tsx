import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { ArrowLeft, Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!isLoaded) return;

    try {
      setLoading(true);

      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(student)/(tabs)/dashboard");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.errors?.[0]?.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="flex-1 px-6 pt-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-8 self-start"
          activeOpacity={0.7}
        >
          <ArrowLeft size={28} color="#1f2937" />
        </TouchableOpacity>

        <View className="mb-12">
          <Text className="text-4xl font-bold text-gray-900 mb-3">
            Welcome Back
          </Text>
          <Text className="text-lg text-gray-600">
            Sign in to continue your learning journey
          </Text>
        </View>

        <View className="mb-8">
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Password
            </Text>
            <View className="relative">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900 pr-12"
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4"
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#6b7280" />
                ) : (
                  <Eye size={20} color="#6b7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSignIn}
            disabled={loading || !email || !password}
            className={`${
              loading || !email || !password ? "bg-gray-300" : "bg-primary-600"
            } rounded-xl py-4`}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-semibold text-center">
                Sign In
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center justify-center">
          <Text className="text-gray-600 text-base">
            Don&apos;t have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.replace("/(public)/sign-up")}>
            <Text className="text-primary-600 font-semibold text-base">
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
