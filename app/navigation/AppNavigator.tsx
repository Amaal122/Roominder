import { Redirect } from "expo-router";

// Legacy navigator placeholder: redirect into the main app stack
export default function AppNavigator() {
  return <Redirect href="/homescreen" />;
}
