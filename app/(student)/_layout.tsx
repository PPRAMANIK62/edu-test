import { Stack } from "expo-router";

export default function StudentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="courses/[courseId]"
        options={{ presentation: "card" }}
      />
      <Stack.Screen
        name="test/[testId]/intro"
        options={{ presentation: "card" }}
      />
      <Stack.Screen
        name="attempt/[attemptId]"
        options={{ presentation: "fullScreenModal", gestureEnabled: false }}
      />
      <Stack.Screen
        name="attempt/[attemptId]/review"
        options={{ presentation: "card" }}
      />
    </Stack>
  );
}
