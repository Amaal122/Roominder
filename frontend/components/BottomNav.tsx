import { usePathname, useRouter, type Href } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type Tab = {
  key: string;
  label: string;
  route: Href;
  icon: string;
  activeWhen: string[];
};

const tabs: Tab[] = [
  {
    key: "home",
    label: "Home",
    route: "/homescreen" as Href,
    icon: "🏠",
    activeWhen: ["/homescreen", "/screens/HomeScreen"],
  },
  {
    key: "match",
    label: "Match",
    route: "/match" as Href,
    icon: "👥",
    activeWhen: ["/match", "/roomatematch", "/roommateprofile"],
  },
  {
    key: "chat",
    label: "Chat",
    route: "/chat" as Href,
    icon: "💬",
    activeWhen: ["/chat"],
  },
  {
    key: "favorites",
    label: "Favorites",
    route: "/favorite" as Href,
    icon: "❤️",
    activeWhen: ["/favorite"],
  },
  {
    key: "profile",
    label: "Profile",
    route: "/profile" as Href,
    icon: "👤",
    activeWhen: ["/profile"],
  },
  {
    key: "seekerbot",
    label: "SeekerBot",
    route: "/chatbot-seeker" as Href,
    icon: "🤖",
    activeWhen: ["/chatbot-seeker"],
  },
];

const hiddenPrefixes = [
  "/",
  "/index",
  "/homescreen",
  "/screens/HomeScreen",
  "/roomatematch",
  "/login",
  "/register",
  "/onboarding",
  "/findhome",
  "/lookingfor",
  "/location",
  "/completeprofile",
  "/form",
  "/reviewprofile",
  "/newproperty",
  "/propertyowner",
  "/propertyownerdetail",
  "/propertyownerapplications",
  "/sweethome",
  "/chatbot-owner",
  "/screens/Owner",
  "/screens/ApplicationConfirmation",
  "/screens/VisitConfirmation",
];

const shouldHide = (pathname: string) =>
  hiddenPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  if (shouldHide(pathname)) return null;

  return (
    <View style={[styles.tabBar, isDark && styles.tabBarDark]}>
      {tabs.map((tab) => {
        const active = tab.activeWhen.some(
          (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
        );

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            activeOpacity={0.8}
            onPress={() => {
              if (!active) router.push(tab.route);
            }}
          >
            <Text style={[styles.tabIcon, !active && styles.tabIconInactive]}>{tab.icon}</Text>
            <Text
              style={[
                styles.tabLabel,
                isDark && styles.tabLabelDark,
                active && styles.tabLabelActive,
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: "#e6e9ef",
  },
  tabBarDark: {
    backgroundColor: Colors.dark.card,
    borderTopColor: Colors.dark.border,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
    gap: 2,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabIconInactive: {
    opacity: 0.58,
  },
  tabLabel: {
    fontSize: 10,
    color: "#AAAAAA",
    fontWeight: "500",
  },
  tabLabelDark: {
    color: Colors.dark.mutedText,
  },
  tabLabelActive: {
    color: "#F4896B",
    fontWeight: "700",
  },
});
