import { router } from "expo-router";
import { Award, ChevronRight } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

type ButtonProps = {
  bgColor: "primary" | "green";
  iconColor: string;
  label: string;
};

const QuickActionButton = ({ bgColor, iconColor, label }: ButtonProps) => {
  return (
    <TouchableOpacity
      onPress={() => router.push("/(student)/(tabs)/tests")}
      activeOpacity={0.7}
      className="bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm"
    >
      <View className="flex-row items-center">
        <View className={`rounded-full p-2.5 mr-3 bg-${bgColor}-50`}>
          <Award size={20} color={iconColor} />
        </View>
        <Text className="text-gray-900 font-semibold text-base">{label}</Text>
      </View>
      <ChevronRight size={20} color="#9ca3af" />
    </TouchableOpacity>
  );
};

export default QuickActionButton;
