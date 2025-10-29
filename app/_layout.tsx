import { Stack } from "expo-router";
import { AppwriteProvider } from "@/providers/appwrite";
import "./global.css";

export default function RootLayout() {
  return (
    <AppwriteProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AppwriteProvider>
  );
}
