import { AntDesign, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function SafeSecureScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
        }}
        style={styles.topSection}
      >
        <LinearGradient
          colors={["rgba(244, 137, 107, 0.9)", "rgba(126, 206, 196, 0.8)"]}
          style={styles.overlay}
        >
          <View style={styles.iconBox}>
            <Feather name="shield" size={40} color="white" />
          </View>
        </LinearGradient>
      </ImageBackground>

      <View style={[styles.bottomSection, isDark && styles.bottomSectionDark]}>
        <Text style={[styles.title, isDark && styles.titleDark]}>
          Safe & Secure Platform
        </Text>
        <Text style={[styles.description, isDark && styles.mutedTextDark]}>
          Digital contracts, verified profiles, and secure communication for a
          trustworthy colocation experience.
        </Text>

        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={styles.activeDot} />
        </View>

        <TouchableOpacity
          style={styles.sliderButton}
          onPress={() => router.push("/findhome")}
        >
          <View style={[styles.sliderThumb, isDark && styles.sliderThumbDark]}>
            <AntDesign
              name="right"
              size={20}
              color={isDark ? Colors.dark.text : "#6D28D9"}
            />
          </View>
          <Text style={styles.sliderText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7F3" },
  containerDark: { backgroundColor: Colors.dark.background },
  topSection: { flex: 1.2 },
  overlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  iconBox: {
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.28)",
    borderRadius: 25,
  },
  bottomSection: {
    flex: 1,
    padding: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    backgroundColor: "#FFF",
  },
  bottomSectionDark: { backgroundColor: Colors.dark.background },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2B2B33",
    marginBottom: 15,
  },
  titleDark: { color: Colors.dark.text },
  description: { fontSize: 16, color: "#7A6D6A", lineHeight: 24 },
  mutedTextDark: { color: Colors.dark.mutedText },
  pagination: {
    flexDirection: "row",
    marginVertical: 30,
    justifyContent: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F9D4C2",
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#36b37e",
  },
  sliderButton: {
    backgroundColor: "#F4896B",
    height: 64,
    borderRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
  },
  sliderThumb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  sliderThumbDark: { backgroundColor: Colors.dark.card },
  sliderText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginRight: 52,
  },
});
