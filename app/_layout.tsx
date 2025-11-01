import { AppwriteProvider } from "@/providers/appwrite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <>
      <SafeAreaProvider>
        <AppwriteProvider>
          <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{ headerShown: false }} />
          </QueryClientProvider>
        </AppwriteProvider>
      </SafeAreaProvider>
    </>
  );
}
