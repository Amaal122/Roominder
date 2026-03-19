import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    ImageBackground,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LocationStep() {
  const router = useRouter();
  const { flow } = useLocalSearchParams<{ flow?: string }>();
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState(10);
  const [sliderWidth, setSliderWidth] = useState(0);
  const [locStatus, setLocStatus] = useState<
    "idle" | "loading" | "error" | "success"
  >("idle");
  const [locError, setLocError] = useState("");

  const radiusPercent = useMemo(() => {
    const clamped = Math.max(1, Math.min(50, radius));
    return ((clamped - 1) / 49) * 100;
  }, [radius]);

  const handleContinue = () => {
    if (flow === "housing") {
      router.push("/homescreen");
      return;
    }
    router.push("/form");
  };

  const handleUseLocation = async () => {
    setLocError("");
    setLocStatus("loading");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocStatus("error");
        setLocError("Permission denied");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const label = `${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`;
      setLocation(label);
      setLocStatus("success");
    } catch (error: any) {
      setLocStatus("error");
      setLocError(error?.message ?? "Unable to fetch location");
    }
  };

  const updateRadiusFromX = (x: number) => {
    if (!sliderWidth) return;
    const ratio = Math.max(0, Math.min(1, x / sliderWidth));
    const value = 1 + ratio * 49;
    setRadius(Math.round(value));
  };

  return (
    <LinearGradient
      colors={["#c8f7d8", "#d8fae6", "#e9fdf1", "#f6fef9", "#ffffff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.cardWrapper}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={22} color="#2f9b6e" />
          </TouchableOpacity>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                flow === "housing" && styles.progressFillFull,
              ]}
            />
          </View>

          <Text style={styles.stepLabel}>
            {flow === "housing" ? "Step 3 of 3" : "Step 3 of 5"}
          </Text>
          <Text style={styles.title}>Where do you want to live?</Text>
          <Text style={styles.subtitle}>
            Set your preferred location and search radius
          </Text>

          <ImageBackground
            style={styles.mapPlaceholder}
            imageStyle={styles.mapImage}
            source={require("../assets/images/map.jpg")}
          >
            <View style={styles.mapOverlay}>
              <Feather name="map-pin" size={32} color="#ffffff" />
            </View>
          </ImageBackground>

          <TouchableOpacity
            style={[
              styles.locationBtn,
              locStatus === "loading" && styles.disabled,
            ]}
            activeOpacity={0.9}
            onPress={handleUseLocation}
            disabled={locStatus === "loading"}
          >
            {locStatus === "loading" ? (
              <ActivityIndicator size="small" color="#36b37e" />
            ) : (
              <Feather name="navigation" size={18} color="#36b37e" />
            )}
            <Text style={styles.locationBtnText}>Use My Location</Text>
            <Feather name="map-pin" size={16} color="#36b37e" />
          </TouchableOpacity>

          {locError ? <Text style={styles.errorText}>{locError}</Text> : null}

          <View style={styles.inputWrapper}>
            <Feather name="search" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Search city, area, or address"
              placeholderTextColor="#9CA3AF"
              value={location}
              onChangeText={setLocation}
            />
          </View>

          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Search Radius</Text>
            <Text style={styles.sliderValue}>{radius} km</Text>
          </View>
          <View
            style={styles.sliderTrack}
            onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(e) => updateRadiusFromX(e.nativeEvent.locationX)}
            onResponderMove={(e) => updateRadiusFromX(e.nativeEvent.locationX)}
          >
            <View
              style={[styles.sliderThumb, { width: `${radiusPercent}%` }]}
            />
            <View
              style={[styles.sliderHandle, { left: `${radiusPercent}%` }]}
              pointerEvents="none"
            />
          </View>
          <View style={styles.sliderEnds}>
            <Text style={styles.sliderEndText}>1 km</Text>
            <Text style={styles.sliderEndText}>50 km</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.9}
          onPress={handleContinue}
        >
          <Text style={styles.ctaText}>Continue</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1, justifyContent: "space-between" },
  cardWrapper: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: "transparent",
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(54, 179, 126, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(54, 179, 126, 0.16)",
    overflow: "hidden",
  },
  progressFill: {
    width: "66%",
    height: "100%",
    backgroundColor: "#36b37e",
  },
  progressFillFull: { width: "100%" },
  stepLabel: { color: "#5c7a6a", fontSize: 13, fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "800", color: "#0f3d2a" },
  subtitle: { color: "#4f6a5b", fontSize: 15 },
  mapPlaceholder: {
    height: 160,
    borderRadius: 20,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#36b37e",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  mapImage: {
    borderRadius: 20,
  },
  mapOverlay: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#36b37e",
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8,
  },
  locationBtnText: { color: "#36b37e", fontWeight: "700", fontSize: 15 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(54, 179, 126, 0.25)",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 52,
    backgroundColor: "rgba(255,255,255,0.8)",
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0f3d2a",
  },
  sliderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sliderLabel: { fontSize: 15, fontWeight: "700", color: "#0f3d2a" },
  sliderValue: { fontSize: 15, fontWeight: "700", color: "#36b37e" },
  sliderTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: "rgba(54, 179, 126, 0.16)",
    overflow: "hidden",
    position: "relative",
  },
  sliderThumb: {
    height: "100%",
    backgroundColor: "#36b37e",
    borderRadius: 6,
  },
  sliderHandle: {
    position: "absolute",
    top: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#36b37e",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
  },
  sliderEnds: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  sliderEndText: { color: "#4f6a5b", fontSize: 12 },
  errorText: { color: "#ef4444", marginTop: 6 },
  disabled: { opacity: 0.6 },
  cta: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#36b37e",
    borderRadius: 16,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "transparent",
    elevation: 0,
  },
  ctaText: { color: "#0f3d2a", fontSize: 16, fontWeight: "700" },
});
