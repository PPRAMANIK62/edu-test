import { useAppwrite } from "@/hooks/use-appwrite";
import { isTeacher } from "@/lib/permissions";
import { useRouter } from "expo-router";
import {
  Bell,
  ChevronRight,
  CreditCard,
  FileText,
  HelpCircle,
  LogOut,
  Mail,
  Shield,
  User,
  Users,
} from "lucide-react-native";
import React from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BUSINESS_ITEMS = [
  {
    icon: <CreditCard size={20} color="#10b981" />,
    label: "Payment Settings",
    onPress: () => console.log("Payment settings"),
    iconBgColor: "bg-emerald-50",
  },
  {
    icon: <FileText size={20} color="#a855f7" />,
    label: "Tax Information",
    onPress: () => console.log("Tax information"),
    iconBgColor: "bg-purple-50",
  },
];

const SUPPORT_ITEMS = [
  {
    icon: <HelpCircle size={20} color="#3b82f6" />,
    label: "Help Center",
    onPress: () => console.log("Help center"),
    iconBgColor: "bg-blue-50",
  },
  {
    icon: <Shield size={20} color="#6b7280" />,
    label: "Privacy Policy",
    onPress: () => console.log("Privacy policy"),
    iconBgColor: "bg-gray-100",
  },
];

const TeacherProfile = () => {
  const { userProfile: user, signOut } = useAppwrite();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(public)/welcome");
        },
      },
    ]);
  };

  // Create account items array dynamically based on user permissions
  const accountItems = [
    {
      icon: <User size={20} color="#7c3aed" />,
      label: "Edit Profile",
      onPress: () => console.log("Edit profile"),
      iconBgColor: "bg-violet-50",
    },
    {
      icon: <Mail size={20} color="#0ea5e9" />,
      label: "Email Settings",
      onPress: () => console.log("Email settings"),
      iconBgColor: "bg-sky-50",
    },
    {
      icon: <Bell size={20} color="#f59e0b" />,
      label: "Notifications",
      onPress: () => console.log("Notifications"),
      iconBgColor: "bg-amber-50",
    },
  ];

  // Add "Manage Users" only if user has permission
  if (user && isTeacher(user.role)) {
    accountItems.push({
      icon: <Users size={20} color="#ec4899" />,
      label: "Manage Users",
      onPress: () => router.push("/(teacher)/user-management"),
      iconBgColor: "bg-pink-50",
    });
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-6" style={{ paddingTop: insets.top + 24 }}>
          <Text className="text-3xl font-bold text-gray-900 mb-6">Profile</Text>

          <View className="bg-white rounded-2xl p-6 items-center shadow-sm mb-6">
            <View className="bg-gradient-to-br from-violet-100 to-sky-100 rounded-full w-20 h-20 items-center justify-center mb-4">
              <Text className="text-violet-700 font-bold text-3xl">
                {user?.firstName?.charAt(0) || user?.email.charAt(0) || "T"}
              </Text>
            </View>
            <Text className="text-gray-900 font-bold text-xl mb-1">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email}
            </Text>
            <Text className="text-gray-500 text-sm mb-3">{user?.email}</Text>
            <View className="bg-violet-100 rounded-full px-3 py-1">
              <Text className="text-violet-700 font-semibold text-sm">
                {user && isTeacher(user.role)
                  ? "Teacher Account"
                  : "Teaching Assistant Account"}
              </Text>
            </View>
          </View>

          <MenuSection title="ACCOUNT" items={accountItems} />
          <MenuSection title="BUSINESS" items={BUSINESS_ITEMS} />
          <MenuSection title="SUPPORT" items={SUPPORT_ITEMS} />

          <TouchableOpacity
            activeOpacity={0.7}
            className="bg-red-50 rounded-2xl p-4 flex-row items-center"
            onPress={handleSignOut}
          >
            <View className="bg-red-100 rounded-full p-2 mr-3">
              <LogOut size={20} color="#ef4444" />
            </View>
            <Text className="text-red-600 font-bold text-base">Sign Out</Text>
          </TouchableOpacity>

          <View className="mt-6 items-center">
            <Text className="text-gray-400 text-xs">Version 1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default TeacherProfile;

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  iconBgColor: string;
  showBorder?: boolean;
}

const MenuItem = ({
  icon,
  label,
  onPress,
  iconBgColor,
  showBorder = false,
}: MenuItemProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className={`flex-row items-center p-4 ${showBorder ? "border-b border-gray-100" : ""}`}
      onPress={onPress}
    >
      <View className={`${iconBgColor} rounded-full p-2 mr-3`}>{icon}</View>
      <Text className="flex-1 text-gray-900 font-semibold">{label}</Text>
      <ChevronRight size={20} color="#9ca3af" />
    </TouchableOpacity>
  );
};

interface MenuSectionProps {
  title: string;
  items: {
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
    iconBgColor: string;
  }[];
}

const MenuSection = ({ title, items }: MenuSectionProps) => {
  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-500 mb-2 px-2">
        {title}
      </Text>
      <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {items.map((item, index) => (
          <MenuItem
            key={item.label}
            {...item}
            showBorder={index < items.length - 1}
          />
        ))}
      </View>
    </View>
  );
};
