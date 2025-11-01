import { Text, TouchableOpacity } from "react-native";

const ActionButton = ({
  onPress,
  variant,
  label,
}: {
  onPress: () => void;
  variant: "primary" | "secondary";
  label: string;
}) => {
  const isPrimary = variant === "primary";
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`${isPrimary ? "bg-primary-600" : "bg-gray-100"} rounded-xl py-4`}
      activeOpacity={0.8}
    >
      <Text
        className={`${isPrimary ? "text-white" : "text-gray-900"} text-center font-semibold text-base`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default ActionButton;
