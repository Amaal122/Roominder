import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function LocationStep() {
  const router = useRouter();
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
    router.push("/completeprofile");
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
      colors={["#6D28D9", "#9333EA", "#F472B6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.cardWrapper}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={22} color="#4C1D95" />
          </TouchableOpacity>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          <Text style={styles.stepLabel}>Step 2 of 5</Text>
          <Text style={styles.title}>Where do you want to live?</Text>
          <Text style={styles.subtitle}>
            Set your preferred location and search radius
          </Text>

          <View style={styles.mapPlaceholder}>
            <Feather name="map-pin" size={48} color="#7C3AED" />
          </View>

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
              <ActivityIndicator size="small" color="#7C3AED" />
            ) : (
              <Feather name="navigation" size={18} color="#7C3AED" />
            )}
            <Text style={styles.locationBtnText}>Use My Location</Text>
            <Feather name="map-pin" size={16} color="#F43F5E" />
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
    backgroundColor: "#F8FAFC",
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressFill: {
    width: "44%",
    height: "100%",
    backgroundColor: "#7C3AED",
  },
  stepLabel: { color: "#6B7280", fontSize: 13, fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "800", color: "#111827" },
  subtitle: { color: "#6B7280", fontSize: 15 },
  mapPlaceholder: {
    height: 220,
    borderRadius: 24,
    backgroundColor: "#EEE9FF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#7C3AED",
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8,
  },
  locationBtnText: { color: "#7C3AED", fontWeight: "700", fontSize: 15 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 52,
    backgroundColor: "#FFFFFF",
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
  sliderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sliderLabel: { fontSize: 15, fontWeight: "700", color: "#111827" },
  sliderValue: { fontSize: 15, fontWeight: "700", color: "#7C3AED" },
  sliderTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
    position: "relative",
  },
  sliderThumb: {
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 6,
  },
  sliderHandle: {
    position: "absolute",
    top: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#7C3AED",
    borderWidth: 2,
    borderColor: "#fff",
    transform: [{ translateX: -11 }],
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sliderEnds: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderEndText: { color: "#9CA3AF", fontSize: 12 },
  cta: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#7C3AED",
    borderRadius: 16,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  ctaText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  errorText: { color: "#DC2626", fontSize: 12, marginTop: 6 },
  disabled: { opacity: 0.6 },
});
