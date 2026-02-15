import { useAuth } from "@/providers/auth";
import { signUpSchema, validateForm } from "@/lib/schemas";
import { useRouter } from "expo-router";
import { ArrowLeft, Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SignUpScreen = () => {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const { isValid, errors: validationErrors } = validateForm(signUpSchema, {
      email,
      password,
      firstName,
      lastName,
    });
    setErrors(validationErrors);
    return isValid;
  };

  const handleSignUp = async () => {
    if (!validate()) {
      const errorMessages = Object.values(errors).filter(Boolean);
      if (errorMessages.length > 0) {
        Alert.alert("Error", errorMessages[0]);
      }
      return;
    }

    setLoading(true);
    try {
      // All new sign-ups default to student role
      await signUp(email, password, firstName, lastName, "student");
      // Navigate to student dashboard
      router.replace("/(student)/(tabs)/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Sign Up Failed", error.message);
      } else {
        Alert.alert("Sign Up Failed", "An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <ScrollView className="flex-1 px-6 pt-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-8 self-start"
          activeOpacity={0.7}
        >
          <ArrowLeft size={28} color="#1f2937" />
        </TouchableOpacity>

        <View className="mb-8">
          <Text className="text-4xl font-bold text-gray-900 mb-3">
            Create Account
          </Text>
          <Text className="text-lg text-gray-600">
            Join thousands of students preparing for success
          </Text>
        </View>

        <View className="mb-8">
          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              First Name
            </Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter your first name"
              autoCapitalize="words"
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Last Name
            </Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter your last name"
              autoCapitalize="words"
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View className="mb-5">
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
                placeholder="Create a password"
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
            onPress={handleSignUp}
            disabled={loading || !email || !password || !firstName || !lastName}
            className={`${
              loading || !email || !password || !firstName || !lastName
                ? "bg-gray-300"
                : "bg-primary-600"
            } rounded-xl py-4`}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-semibold text-center">
                Create Account
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center justify-center pb-6">
          <Text className="text-gray-600 text-base">
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.replace("/(public)/sign-in")}>
            <Text className="text-primary-600 font-semibold text-base">
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignUpScreen;
