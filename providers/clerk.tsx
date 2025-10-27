import {
  ClerkProvider as BaseClerkProvider,
  ClerkLoaded,
} from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

const tokenCache = {
  async getToken(key: string) {
    try {
      const token = await SecureStore.getItemAsync(key);
      return token;
    } catch (error) {
      console.error("SecureStore get error:", error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, token: string) {
    try {
      return SecureStore.setItemAsync(key, token);
    } catch (error) {
      console.error("SecureStore save error:", error);
    }
  },
};

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseClerkProvider publishableKey={PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ClerkLoaded>{children}</ClerkLoaded>
    </BaseClerkProvider>
  );
}
