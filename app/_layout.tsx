import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function Layout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#F5F5F5" },
        }}
      >
        <Stack.Screen name="sweethome" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="findhome" />
        <Stack.Screen name="lookingfor" />
        <Stack.Screen name="location" />
        <Stack.Screen name="completeprofile" />
        <Stack.Screen name="form" />
        <Stack.Screen name="index" />
        <Stack.Screen name="register" />
      </Stack>
    </>
  );
}
