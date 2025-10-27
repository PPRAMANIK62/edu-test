import { ClerkProvider } from "@/providers/clerk";
import { Stack } from "expo-router";
import "./global.css";

export default function RootLayout() {
  return (
    <ClerkProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ClerkProvider>
  );
}
