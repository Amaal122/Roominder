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
        initialRouteName="(frontend)/index"
      >
        <Stack.Screen name="(frontend)/newproperty" />
        <Stack.Screen name="(frontend)/propertyowner" />
        <Stack.Screen name="(frontend)/propertyownerdetail" />
        <Stack.Screen name="(frontend)/sweethome" />
        <Stack.Screen name="(frontend)/onboarding" />
        <Stack.Screen name="(frontend)/findhome" />
        <Stack.Screen name="(frontend)/lookingfor" />
        <Stack.Screen name="(frontend)/location" />
        <Stack.Screen name="(frontend)/completeprofile" />
        <Stack.Screen name="(frontend)/form" />
        <Stack.Screen name="(frontend)/roomatematch" />
        <Stack.Screen name="(frontend)/index" />
        <Stack.Screen name="(frontend)/register" />
        <Stack.Screen name="(frontend)/homescreen" />
        <Stack.Screen name="(frontend)/match" />
        <Stack.Screen name="(frontend)/favorite" />
        <Stack.Screen name="(frontend)/chat" />
        <Stack.Screen name="(frontend)/chat/[id]" />
        <Stack.Screen name="(frontend)/notifications" />
        <Stack.Screen name="(frontend)/settings" />
        <Stack.Screen name="(frontend)/change-password" />
        <Stack.Screen name="(frontend)/two-factor" />
        <Stack.Screen name="(frontend)/blocked-users" />
        <Stack.Screen name="(frontend)/language" />
        <Stack.Screen name="(frontend)/theme" />
        <Stack.Screen name="(frontend)/about" />
      </Stack>
    </>
  );
}
