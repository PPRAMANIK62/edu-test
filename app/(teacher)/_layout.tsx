import { Stack } from "expo-router";
import React from "react";

const TeacherLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="courses/[courseId]/edit"
        options={{ presentation: "card" }}
      />
      <Stack.Screen name="courses/create" options={{ presentation: "card" }} />
      <Stack.Screen
        name="students/[studentId]"
        options={{ presentation: "card" }}
      />
      <Stack.Screen
        name="courses/[courseId]/tests/create"
        options={{ presentation: "card" }}
      />
      <Stack.Screen
        name="tests/[testId]/questions/index"
        options={{ presentation: "card" }}
      />
      <Stack.Screen
        name="tests/[testId]/questions/create"
        options={{ presentation: "card" }}
      />
      <Stack.Screen
        name="tests/[testId]/questions/[questionId]/edit"
        options={{ presentation: "card" }}
      />
    </Stack>
  );
};

export default TeacherLayout;
