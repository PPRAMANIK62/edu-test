import { AppwriteProvider } from "@/providers/appwrite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import "./global.css";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <AppwriteProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </AppwriteProvider>
  );
}
