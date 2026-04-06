import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SeekerProfileProvider } from "./contexts/SeekerProfileContext";
import { initI18n } from "../i18n";
import { useEffect, useState } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const scheme = useColorScheme();

  useEffect(() => {
    initI18n().then(() => setReady(true));
  }, []);

  if (!ready) return null; // or a splash screen

  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <SeekerProfileProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors[scheme].background },
          }}
          initialRouteName="index"
        >
          <Stack.Screen name="newproperty" />
          <Stack.Screen name="propertyowner" />
          <Stack.Screen name="propertyownerdetail" />
          <Stack.Screen name="sweethome" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="findhome" />
          <Stack.Screen name="lookingfor" />
          <Stack.Screen name="location" />
          <Stack.Screen name="completeprofile" />
          <Stack.Screen name="form" />
          <Stack.Screen name="roomatematch" />
          <Stack.Screen name="index" />
          <Stack.Screen name="register" />
          <Stack.Screen name="homescreen" />
          <Stack.Screen name="match" />
          <Stack.Screen name="favorite" />
          <Stack.Screen name="chat" />
          <Stack.Screen name="chat/[id]" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="change-password" />
          <Stack.Screen name="two-factor" />
          <Stack.Screen name="blocked-users" />
          <Stack.Screen name="language" />
          <Stack.Screen name="theme" />
          <Stack.Screen name="about" />
        </Stack>
      </SeekerProfileProvider>
    </>
  );
}